// app/api/song/play/route.ts
// 播放计数接口：播放器每次开始播放 → 这里给这首歌 plays +1
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });

    // 播放次数 +1（updata 前先校验歌存在，不存在就不加）
    const song = await prisma.song.findUnique({ where: { id } });
    if (!song) return NextResponse.json({ ok: false }, { status: 404 });

    await prisma.song.update({
      where: { id },
      data: { plays: { increment: 1 } }, // increment：在原来数字上 +1
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
