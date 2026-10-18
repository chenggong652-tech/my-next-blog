// app/music/[id]/page.tsx
// 歌曲详情页：/music/歌曲id → 播放器 + 频谱 + 歌词滚动 + 歌单连播
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
import MusicPlayer from "./MusicPlayer";

// 动态标题：打开哪首歌，标题就是哪首
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const song = await prisma.song.findUnique({ where: { id } });
  return { title: song ? `${song.title} | 音乐馆` : "歌曲不存在" };
}

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const song = await prisma.song.findUnique({ where: { id } });

  // 找不到 → 友好的提示
  if (!song) {
    return (
      <main style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center" }}>
        <h1>😢 歌曲不存在</h1>
        <Link href="/music" style={{ color: "var(--link)" }}>← 回音乐馆</Link>
      </main>
    );
  }

  // 🔒 已下架的歌：直链访问也拦住，提示一下
  if (song.status !== "published") {
    return (
      <main style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center" }}>
        <h1>🔒 这首歌已下架</h1>
        <p style={{ color: "var(--text-light)" }}>管理员暂时把它收起来了，去音乐馆看看别的吧</p>
        <Link href="/music" style={{ color: "var(--link)" }}>← 回音乐馆</Link>
      </main>
    );
  }

  // 🎵 歌单队列：按 sortOrder 排好序的全部歌曲，找当前歌的前后邻居
  const allSongs = await prisma.song.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  const idx = allSongs.findIndex((s) => s.id === id);
  const total = allSongs.length;
  const prevId = idx > 0 ? allSongs[idx - 1].id : null;
  const nextId = idx >= 0 && idx < total - 1 ? allSongs[idx + 1].id : null;

  // ❤️ 当前用户收藏过这首吗？（没登录就是 false）
  const session = await auth();
  const liked = session?.user?.id
    ? !!(await prisma.songLike.findUnique({
        where: { songId_userId: { songId: id, userId: session.user.id } },
      }))
    : false;

  return (
    <main style={{ maxWidth: "700px", margin: "40px auto", padding: "0 20px" }}>
      {/* 返回链接 */}
      <Link href="/music" style={{ color: "var(--link)", fontSize: "14px" }}>← 音乐馆</Link>

      {/* 播放器：旋转封面 + 频谱 + 歌词滚动 + 连播 */}
      <div style={{ marginTop: "16px" }}>
        <MusicPlayer
          song={song}
          prevId={prevId}
          nextId={nextId}
          position={idx + 1}
          total={total}
          allIds={allSongs.map((s) => s.id)} // 整个歌单的 id 列表（随机/循环用）
          liked={liked} // 当前用户收藏状态
        />
      </div>
    </main>
  );
}
