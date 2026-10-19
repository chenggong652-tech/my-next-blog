// app/api/purchase/route.ts
// 第 32 课升级版：先下单 → 支付 → 发货（支持 3 种支付方式）
import { prisma } from "@/lib/prisma";
import { calcLevel, discountFor } from "@/lib/vip";
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
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { balance: true, totalSpent: true, level: true } });
    const payPrice = Math.round(resource.price * discountFor(user?.level ?? 1)); // 大白话：会员打折后的实付价（Lv2+ 九折）
    if ((user?.balance ?? 0) < payPrice) {
      return Response.json({ ok: false, msg: `余额不足，需 ¥${(payPrice / 100).toFixed(1)}，先去充值` });
    }
    const newTotal = (user?.totalSpent ?? 0) + payPrice; // 大白话：买完这次，累计消费变成多少（按实付算）
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          balance: { decrement: payPrice }, // 饭卡扣实付价
          totalSpent: { increment: payPrice }, // 经验值 + 实付价
          level: calcLevel(newTotal), // 按新经验值算等级，写回用户
        },
      }),
      prisma.order.create({
        data: { resourceId, userId: session.user.id, amount: payPrice, method: "balance", status: "paid", paidAt: new Date() },
      }),
      prisma.purchase.create({ data: { resourceId, userId: session.user.id, amount: payPrice } }),
    ]);
    return Response.json({ ok: true, msg: "购买成功" });
  }

  // ===== 模拟微信/支付宝：先开订单（待支付），前端跳去模拟支付页 =====
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { level: true } });
  const payPrice = Math.round(resource.price * discountFor(me?.level ?? 1)); // 大白话：会员打折后的实付价
  const order = await prisma.order.create({
    data: { resourceId, userId: session.user.id, amount: payPrice, method },
  });
  return Response.json({ ok: true, msg: "订单已创建，去支付", orderId: order.id });
}
