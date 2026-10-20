// app/api/purchase/route.ts
// 第 32 课升级版：先下单 → 支付 → 发货（支持 3 种支付方式）
// 🅲1 升级：收款按"最终价"（活动价→叠会员折扣），不再只认原价
// 🅲2 升级：订单记推广来源 + 成交自动结算 20% 佣金给推广员
import { prisma } from "@/lib/prisma";
import { calcLevel, discountFor, effectivePrice } from "@/lib/vip";
import { findReferrer } from "@/lib/ref";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // 1. 验身份
  const session = await auth();
  if (!session?.user?.id) return Response.json({ ok: false, msg: "请先登录" });

  // 2. 读参数：买哪个资源 + 用什么支付
  const body = await request.json();
  const resourceId = body.resourceId as string;
  const method = (body.method as string) || "balance"; // balance=余额 / wechat=模拟微信 / alipay=模拟支付宝
  if (!resourceId) return Response.json({ ok: false, msg: "缺少资源id" });
  if (!["balance", "wechat", "alipay"].includes(method)) return Response.json({ ok: false, msg: "未知支付方式" });

  // 3. 验货：资源存在且上架
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource || resource.status !== "published") return Response.json({ ok: false, msg: "资源不存在或已下架" });

  // 4. 免费资源：直接拿走
  if (resource.price === 0) return Response.json({ ok: true, msg: "免费资源，直接下载" });

  // 5. 已买过：直接放行（不重复下单）
  const existed = await prisma.purchase.findUnique({
    where: { resourceId_userId: { resourceId, userId: session.user.id } },
  });
  if (existed) return Response.json({ ok: true, msg: "已购买过，直接下载" });

  // ===== 余额支付：秒到（饭卡够 → 扣钱 + 订单已付 + 记购买，一个事务）=====
  if (method === "balance") {
    const uid = session.user.id; // 已通过上面的登录检查，这里保证非空
    const user = await prisma.user.findUnique({ where: { id: uid }, select: { balance: true, totalSpent: true, level: true, name: true } });
    const payPrice = effectivePrice(resource, user?.level ?? 1); // 🅲1 最终价：活动价→叠会员折扣（Lv2+ 九折）
    if ((user?.balance ?? 0) < payPrice) {
      return Response.json({ ok: false, msg: `余额不足，需 ¥${(payPrice / 100).toFixed(1)}，先去充值` });
    }

    // 🅲2 认亲戚：读浏览器 cookie 里的推广码 → 找推广员（自己买给自己不算佣金）
    const cookies = request.headers.get("cookie") || "";
    const refMatch = cookies.match(/(?:^|;\s*)ref=([^;]+)/);
    const referrer = await findReferrer(prisma, refMatch?.[1]);
    const hasReferrer = referrer && referrer.id !== uid;
    const commission = hasReferrer ? Math.round((payPrice * 20) / 100) : 0; // 佣金 = 实付 × 20%

    const newTotal = (user?.totalSpent ?? 0) + payPrice; // 大白话：买完这次，累计消费变成多少（按实付算）
    // 一个事务里完成：扣钱 + 建订单 + 记购买 + 给推广员结佣金（全部成功才算，绝不半途而废）
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: uid },
        data: {
          balance: { decrement: payPrice }, // 饭卡扣实付价
          totalSpent: { increment: payPrice }, // 经验值 + 实付价
          level: calcLevel(newTotal), // 按新经验值算等级，写回用户
        },
      });
      const order = await tx.order.create({
        data: { resourceId, userId: uid, amount: payPrice, method: "balance", status: "paid", paidAt: new Date(), refUserId: hasReferrer ? referrer.id : null },
      });
      await tx.purchase.create({ data: { resourceId, userId: uid, amount: payPrice } });
      // 🅲2 给推广员结佣金：加余额 + 写明细
      if (hasReferrer && commission > 0) {
        await tx.user.update({ where: { id: referrer.id }, data: { commission: { increment: commission } } });
        await tx.commission.create({
          data: {
            userId: referrer.id,
            orderId: order.id,
            buyerName: user?.name || "用户",
            resourceTitle: resource.title,
            amount: commission,
          },
        });
      }
    });
    return Response.json({ ok: true, msg: "购买成功" });
  }

  // ===== 模拟微信/支付宝：先开订单（待支付），前端跳去模拟支付页 =====
  const uid2 = session.user.id;
  const me = await prisma.user.findUnique({ where: { id: uid2 }, select: { level: true } });
  const payPrice = effectivePrice(resource, me?.level ?? 1); // 🅲1 最终价：活动价→叠会员折扣
  // 🅲2 认亲戚：模拟支付订单也记推广来源（支付成功时按这个结佣金）
  const cookies2 = request.headers.get("cookie") || "";
  const refMatch2 = cookies2.match(/(?:^|;\s*)ref=([^;]+)/);
  const referrer2 = await findReferrer(prisma, refMatch2?.[1]);
  const order = await prisma.order.create({
    data: {
      resourceId,
      userId: uid2,
      amount: payPrice,
      method,
      refUserId: referrer2 && referrer2.id !== uid2 ? referrer2.id : null,
    },
  });
  return Response.json({ ok: true, msg: "订单已创建，去支付", orderId: order.id });
}
