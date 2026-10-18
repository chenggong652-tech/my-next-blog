// app/api/song/like/route.ts
// 收藏/取消收藏接口：登录用户点 ❤️ → 有就取消、没有就加上（toggle 开关）
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. 必须登录（没登录 → 前端会提示去登录）
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, needLogin: true }, { status: 401 });
  }

  // 2. 拿要收藏的歌
  const { id } = await req.json();
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  // 3. 查"这个用户有没有收藏过这首歌"
  const existing = await prisma.songLike.findUnique({
    where: { songId_userId: { songId: id, userId: session.user.id } },
  });

  if (existing) {
    // 收藏过 → 取消收藏（再点一次就是取消）
    await prisma.songLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, liked: false });
  }

  // 没收藏过 → 收藏
  await prisma.songLike.create({
    data: { songId: id, userId: session.user.id },
  });
  return NextResponse.json({ ok: true, liked: true });
}
