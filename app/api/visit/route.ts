// app/api/visit/route.ts
// 访问记录接口：页面打开时 POST 一次，记一条访问
import { prisma } from "@/lib/prisma";

// 北京时间今天：YYYY-MM-DD（服务器可能在海外用UTC，所以要+8小时再取日期）
function todayCN() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

export async function POST() {
  await prisma.visit.create({
    data: { date: todayCN() },
  });
  return Response.json({ ok: true });
}
