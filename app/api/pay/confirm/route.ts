// app/api/pay/confirm/route.ts
// 第 32 课：模拟支付回调（真实世界 = 支付宝/微信主动通知网站"钱到了"）
// 🅲2 升级：支付成功时，如果这单是推广带来的 → 给推广员结 20% 佣金
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { calcLevel } from "@/lib/vip";

export async function POST(request: NextRequest) {
  // 1. 验身份（真实回调其实不用登录，用签名验；模拟版图省事用登录 + 订单归属）
  const session = await auth();
  if (!session?.user?.id) return Response.json({ ok: false, msg: "请先登录" });

  // 2. 看是哪个订单付了
  const body = await request.json();
  const orderId = body.orderId as string;
  if (!orderId) return Response.json({ ok: false, msg: "缺少订单id" });

  // 3. 订单存在吗？是你下的吗？
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return Response.json({ ok: false, msg: "订单不存在" });
  if (order.userId !== session.user.id) return Response.json({ ok: false, msg: "这不是你的订单" });

  // 4. 已支付：直接放行（支付平台可能重复通知，不能重复发货）
  if (order.status === "paid") return Response.json({ ok: true, msg: "订单已支付" });

  // 5. 发货：订单标记"已付" + 记购买记录 + 给推广员结佣金（一个事务）
  //    ⚠️ 大白话：真实世界里这上面还有一道"验签"——验证这通电话真是支付平台打的，
  //    防骗子冒充"我付了！"。我们模拟版用订单归属校验代替，第 32 课收尾时细讲验签。
  // 大白话：先算出"这个用户买完后的累计消费 + 新等级"
  const buyer = await prisma.user.findUnique({ where: { id: order.userId }, select: { totalSpent: true, name: true } });
  const newTotal = (buyer?.totalSpent ?? 0) + order.amount;

  // 🅲2 认亲戚：订单下单时已经记了 refUserId（推广员），支付成功时结佣金
  // 注意：这个接口只跑一次（重复通知直接放行），佣金不会重复结算
  const resource = await prisma.resource.findUnique({ where: { id: order.resourceId }, select: { title: true } });
  const refUid = order.refUserId ?? null; // 订单可能没有推广来源（自然成交）
  const commission =
    refUid && refUid !== order.userId ? Math.round((order.amount * 20) / 100) : 0;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: "paid", paidAt: new Date() } });
    await tx.purchase.create({ data: { resourceId: order.resourceId, userId: order.userId, amount: order.amount } });
    // 大白话：买家经验值 + 本次金额，等级也一起升
    await tx.user.update({
      where: { id: order.userId },
      data: { totalSpent: { increment: order.amount }, level: calcLevel(newTotal) },
    });
    // 🅲2 给推广员结佣金：加余额 + 写明细
    if (commission > 0 && refUid) {
      await tx.user.update({ where: { id: refUid }, data: { commission: { increment: commission } } });
      await tx.commission.create({
        data: {
          userId: refUid,
          orderId: order.id,
          buyerName: buyer?.name || "用户",
          resourceTitle: resource?.title || "资源",
          amount: commission,
        },
      });
    }
  });

  return Response.json({ ok: true, msg: "支付成功，已发货" });
}
