"use client";
// app/music/MusicHome.tsx
// 音乐馆首页：Hero 横幅 + 风格筛选 + 卡片网格（前端筛选，数据不动）

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

type Song = {
  id: string;
  title: string;
  genre: string;
  cover: string | null;
  audioUrl: string;
  isOriginal: boolean;
  lyrics: string | null;
  plays: number;
};

export default function MusicHome({ songs }: { songs: Song[] }) {
  // 选中的风格（"全部" = 不过滤）+ 搜索关键词
  const [activeGenre, setActiveGenre] = useState("全部");
  const [query, setQuery] = useState("");
  // 🕘 最近播放（从浏览器本地读出来）
  const [recent, setRecent] = useState<{ id: string; title: string; cover: string | null }[]>([]);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem("recentSongs") || "[]"));
    } catch {}
  }, []);

  // 风格列表：从歌曲里自动提取，不重复，保持出现顺序
  const genres = ["全部", ...Array.from(new Set(songs.map((s) => s.genre).filter(Boolean)))];

  // 前端筛选：风格 + 搜索词 两个条件同时生效
  const q = query.trim().toLowerCase();
  const filtered = songs.filter(
    (s) =>
      (activeGenre === "全部" || s.genre === activeGenre) &&
      (!q || s.title.toLowerCase().includes(q) || s.genre.toLowerCase().includes(q))
  );

  const originalCount = songs.filter((s) => s.isOriginal).length;
  const totalPlays = songs.reduce((sum, s) => sum + s.plays, 0); // 全部歌播放次数加起来
  // 🔥 热歌榜：按播放次数从高到低排，取前 3
  const topSongs = [...songs].sort((a, b) => b.plays - a.plays).slice(0, 3);

  return (
    <main style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
      {/* 🎪 Hero 大横幅 */}
      <div
        className="hero"
        style={{
          borderRadius: "16px",
          background: "linear-gradient(135deg, #1c1917 0%, #431407 55%, #7c2d12 100%)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,158,11,0.35), transparent 70%)",
          }}
        />
        <h1 style={{ fontSize: "36px", margin: 0 }}>🎵 音乐馆</h1>
        <p style={{ margin: "10px 0 0", fontSize: "15px", opacity: 0.9, maxWidth: "520px" }}>
          AI 生成的原创音乐，边学边做站、边听边享受
        </p>
        <p style={{ margin: "16px 0 0", fontSize: "13px", opacity: 0.75 }}>
          📀 共 {songs.length} 首 · ✨ AI 原创 {originalCount} 首 · 🎚️ {genres.length - 1} 种风格 · 🔥 总播放 {totalPlays} 次
        </p>
        <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {songs.length > 0 && (
            <Link
              href={`/music/${songs[0].id}`}
              style={{
                color: "#fff",
                fontSize: "13px",
                background: "linear-gradient(135deg,#f59e0b,#dc2626)",
                padding: "6px 14px",
                borderRadius: "20px",
                textDecoration: "none",
                display: "inline-block",
                fontWeight: 600,
              }}
            >
              ▶ 播放全部
            </Link>
          )}
          <Link
            href="/music/likes"
            style={{
              color: "#fff",
              fontSize: "13px",
              background: "rgba(255,255,255,0.15)",
              padding: "6px 14px",
              borderRadius: "20px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            ❤️ 我的收藏
          </Link>
        </div>
      </div>

      {/* 🔥 热歌榜 Top 3 */}
      {songs.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            border: "1px solid var(--card-border)",
            borderRadius: "12px",
            padding: "14px 18px",
            background: "var(--card-bg)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px" }}>🔥 热歌榜</h2>
          <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
            {topSongs.map((s, i) => (
              <Link
                key={s.id}
                href={`/music/${s.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: i === 0 ? "rgba(245,158,11,0.12)" : "transparent",
                }}
              >
                <span style={{ fontSize: "20px", fontWeight: 800, color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#b45309", width: "28px", textAlign: "center" }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontWeight: i === 0 ? 700 : 500, fontSize: "15px" }}>{s.title}</span>
                <span style={{ fontSize: "13px", color: "var(--text-light)" }}>▶ {s.plays} 次</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 🕘 最近播放（有记录才显示） */}
      {recent.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: "16px" }}>🕘 最近播放</h2>
          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }}>
            {recent.map((r) => (
              <Link
                key={r.id}
                href={`/music/${r.id}`}
                style={{ textDecoration: "none", color: "inherit", flexShrink: 0, width: "96px" }}
              >
                <div style={{ border: "1px solid var(--card-border)", borderRadius: "10px", overflow: "hidden", background: "var(--card-bg)" }}>
                  {r.cover ? (
                    <Image src={r.cover} alt={r.title} width={200} height={200} style={{ width: "100%", height: "auto", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", fontSize: "20px" }}>🎧</div>
                  )}
                  <p style={{ margin: 0, padding: "6px 8px", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 🔍 搜索框 */}
      <div style={{ marginTop: "20px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 搜歌名或风格…"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--card-border)",
            background: "var(--card-bg)",
            color: "var(--text)",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* 🎛️ 风格筛选按钮 */}
      {songs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "20px" }}>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1px solid var(--card-border)",
                cursor: "pointer",
                fontSize: "13px",
                background: g === activeGenre ? "linear-gradient(135deg,#f59e0b,#dc2626)" : "var(--card-bg)",
                color: g === activeGenre ? "#fff" : "var(--text)",
                fontWeight: g === activeGenre ? 600 : 400,
              }}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* 🎴 卡片网格 */}
      {filtered.length === 0 ? (
        <p style={{ color: "var(--text-light)", marginTop: 30 }}>
          {songs.length === 0 ? "还没歌，先去后台发布吧" : `这个风格还没有歌`}
        </p>
      ) : (
        <div
          className="music-grid"
          style={{ marginTop: "20px" }}
        >
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/music/${s.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", overflow: "hidden", background: "var(--card-bg)", transition: "transform .15s" }}>
                {s.cover ? (
                  <Image src={s.cover} alt={s.title} width={400} height={400} style={{ width: "100%", height: "auto", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", fontSize: "40px" }}>🎧</div>
                )}
                <div style={{ padding: "12px" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "15px" }}>{s.title}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-light)" }}>
                    {s.genre}
                    {!s.isOriginal && (
                      <span style={{ marginLeft: 6, padding: "2px 6px", borderRadius: "4px", background: "#fef3c7", color: "#92400e", fontSize: "11px" }}>学习版</span>
                    )}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#f59e0b" }}>▶ {s.plays} 次播放</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {/* 📱 响应式样式：小屏手机自动变紧凑 */}
      <style jsx>{`
        .hero {
          padding: 36px 28px;
        }
        .hero h1 {
          font-size: 36px;
        }
        .music-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }
        @media (max-width: 600px) {
          .hero { padding: 24px 18px; }
          .hero h1 { font-size: 28px; }
          .music-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
        }
      `}</style>
    </main>
  );
}
