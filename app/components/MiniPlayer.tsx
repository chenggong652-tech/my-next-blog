"use client";
// app/components/MiniPlayer.tsx
// 🎵 全站悬浮迷你播放条：任何页面底部显示"正在播放"，可播放/暂停/切歌，可关闭（❌）

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer } from "./PlayerProvider";

export default function MiniPlayer() {
  const { song, playing, current, duration, toggle, next, prev } = usePlayer();
  // ❌ 关闭状态：本次会话内隐藏（刷新后恢复显示）
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("miniPlayerClosed") === "1") setHidden(true);
    } catch {}
  }, []);

  const close = () => {
    setHidden(true);
    try {
      sessionStorage.setItem("miniPlayerClosed", "1");
    } catch {}
  };

  // 没歌在播、或被关闭 → 不显示
  if (!song || hidden) return null;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const miniBtn: React.CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "var(--nav-bg)",
        borderTop: "1px solid var(--card-border)",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
      }}
    >
      {/* 封面 + 歌名 + 进度（点击回播放页） */}
      <Link
        href={`/music/${song.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
          color: "inherit",
          flex: 1,
          minWidth: 0,
        }}
      >
        {song.cover ? (
          <Image src={song.cover} alt={song.title} width={40} height={40} style={{ borderRadius: "8px", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", fontSize: 18 }}>🎧</div>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-light)" }}>{fmt(current)} / {fmt(duration)}</p>
        </div>
      </Link>

      {/* 控制按钮：上一首 / 播放暂停 / 下一首 */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
        <button onClick={() => prev()} title="上一首" style={miniBtn}>⏮</button>
        <button
          onClick={() => toggle()}
          title={playing ? "暂停" : "播放"}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg,#f59e0b,#dc2626)",
            color: "#fff",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(245,158,11,0.35)",
          }}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={() => next()} title="下一首" style={miniBtn}>⏭</button>
        {/* ❌ 关闭迷你条（播放不中断；刷新页面恢复显示） */}
        <button
          onClick={close}
          title="关闭迷你播放条"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            color: "var(--text-light)",
            cursor: "pointer",
            fontSize: "15px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
