// app/music/page.tsx
// 音乐馆首页：Hero 横幅 + 风格筛选 + 卡片网格
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import MusicHome from "./MusicHome";

export const metadata: Metadata = {
  title: "🎵 音乐馆 | AizyBase",
};

export default async function MusicPage() {
  // 查所有已上架的歌，按 sortOrder 排序（数字小的在前面）
  const songs = await prisma.song.findMany({
    where: { status: "published" }, // 下架的歌前台不显示
    orderBy: { sortOrder: "asc" },
  });

  return <MusicHome songs={songs} />;
}
