// app/api/favorite/route.ts
// 收藏接口：POST 切换（收藏 / 取消收藏）
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // 必须登录
  const session = await auth();
  if (!session?.user?.id) return Response.json({ ok: false, msg: "请先登录" });

  const body = await request.json();
  const blogId = body.blogId as string;
  if (!blogId) return Response.json({ ok: false, msg: "缺少文章id" });

  // 查：这个用户收藏过这篇文章吗？
  const existing = await prisma.favorite.findUnique({
    where: { userId_blogId: { userId: session.user.id, blogId } },
  });

  if (existing) {
    // 收藏过 → 取消（删掉这条记录）
    await prisma.favorite.delete({ where: { id: existing.id } });
    const count = await prisma.favorite.count({ where: { blogId } });
    return Response.json({ ok: true, favorited: false, count });
  } else {
    // 没收藏 → 收藏（新建一条记录）
    await prisma.favorite.create({
      data: { userId: session.user.id, blogId },
    });
    const count = await prisma.favorite.count({ where: { blogId } });
    return Response.json({ ok: true, favorited: true, count });
  }
}
