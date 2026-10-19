// app/api/topup/route.ts
// 第 31 课：钱包充值接口（本课=模拟充值，第 32 课换成真支付回调）
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

// POST：充值（给当前登录用户加余额，单位：分）
export async function POST(request: NextRequest) {
  // 1. 必须登录
  const session = await auth();
  if (!session?.user?.id) return Response.json({ ok: false, msg: "请先登录" });

  // 2. 读充值金额（分），限制 0.01~200 元
  const body = await request.json();
  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0 || amount > 20000) {
    return Response.json({ ok: false, msg: "充值金额需在 0.01~200 元之间" });
  }

  // 3. 余额 +amount（数据库原子加，不会算错）
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { balance: { increment: amount } },
    select: { balance: true },
  });

  return Response.json({ ok: true, msg: "充值成功", balance: user.balance });
}

// GET：查看我的余额
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ ok: false, msg: "请先登录" });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { balance: true },
  });
  return Response.json({ ok: true, balance: user?.balance ?? 0 });
}
