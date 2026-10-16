// app/api/comment-like/route.ts
// 评论点赞接口：POST 切换（点赞 / 取消点赞）
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // 必须登录
  const session = await auth();
  if (!session?.user?.id) return Response.json({ ok: false, msg: "请先登录" });

  const body = await request.json();
  const commentId = body.commentId as string;
  if (!commentId) return Response.json({ ok: false, msg: "缺少评论id" });

  // 查：这个用户赞过这条评论吗？
  const existing = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId: session.user.id, commentId } },
  });

  if (existing) {
    // 赞过 → 取消（删掉这条记录）
    await prisma.commentLike.delete({ where: { id: existing.id } });
    const count = await prisma.commentLike.count({ where: { commentId } });
    return Response.json({ ok: true, liked: false, count });
  } else {
    // 没赞过 → 点赞（新建一条记录）
    await prisma.commentLike.create({
      data: { userId: session.user.id, commentId },
    });
    const count = await prisma.commentLike.count({ where: { commentId } });
    return Response.json({ ok: true, liked: true, count });
  }
}
