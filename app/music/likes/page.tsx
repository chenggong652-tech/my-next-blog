// app/music/likes/page.tsx
// ❤️ 我的收藏：登录用户收藏过的歌，一页看全
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "❤️ 我的收藏 | AizyBase",
};

export default async function LikesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main style={{ maxWidth: "900px", margin: "60px auto", textAlign: "center", padding: "0 20px" }}>
        <h1 style={{ fontSize: "28px" }}>❤️ 我的收藏</h1>
        <p style={{ color: "var(--text-light)" }}>登录后才能看到你的收藏哦</p>
        <Link href="/login" style={{ color: "var(--link)" }}>→ 去登录</Link>
      </main>
    );
  }

  // 查我收藏的歌（连带歌曲信息，最新的在前）
  const likes = await prisma.songLike.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { song: true },
  });

  return (
    <main style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
      <Link href="/music" style={{ color: "var(--link)", fontSize: "14px" }}>← 音乐馆</Link>
      <h1 style={{ fontSize: "32px", marginTop: 12 }}>❤️ 我的收藏</h1>
      <p style={{ color: "var(--text-light)", marginTop: 8 }}>共收藏 {likes.length} 首</p>

      {likes.length === 0 ? (
        <p style={{ color: "var(--text-light)", marginTop: 30 }}>还没收藏任何歌——去音乐馆点 🤍 就收藏了</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginTop: "20px" }}>
          {likes.map((l) => (
            <Link
              key={l.id}
              href={`/music/${l.song.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", overflow: "hidden", background: "var(--card-bg)" }}>
                {l.song.cover ? (
                  <Image src={l.song.cover} alt={l.song.title} width={400} height={400} style={{ width: "100%", height: "auto", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", fontSize: "40px" }}>🎧</div>
                )}
                <div style={{ padding: "12px" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "15px" }}>{l.song.title}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-light)" }}>
                    {l.song.genre} · ❤️ {l.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
