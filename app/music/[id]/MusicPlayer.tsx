"use client";
// app/music/[id]/MusicPlayer.tsx
// 播放页 UI：接入全局播放器（PlayerProvider）+ 旋转封面 + 真实频谱 + 歌词滚动 + 自定义控制条

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { usePlayer, type QueueSong } from "@/app/components/PlayerProvider";

export default function MusicPlayer({
  song,
  allSongs,
  liked: likedInit,
}: {
  song: QueueSong;
  allSongs: QueueSong[];
  liked: boolean;
}) {
  const player = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lyricsBoxRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null); // 进度条容器

  const [liked, setLiked] = useState(likedInit); // ❤️ 收藏状态
  const [shareCopied, setShareCopied] = useState(false); // 📤 "已复制"提示
  const [offset, setOffset] = useState(0); // 🎚️ 歌词同步偏移（秒）

  // 打开页面时：把这首歌设为"当前播放"（不自动播），并读回上次的歌词偏移
  useEffect(() => {
    player.initSong(song, allSongs);
    try {
      const saved = Number(localStorage.getItem("lyricOffset") || "0");
      if (!isNaN(saved) && saved >= -10 && saved <= 10) setOffset(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.id]);

  // 偏移一改就记住
  useEffect(() => {
    try {
      localStorage.setItem("lyricOffset", String(offset));
    } catch {}
  }, [offset]);

  const { playing, current, duration, mode } = player;

  // 歌词解析（LRC 时间戳 + 均分兜底）——同第 25 课逻辑
  const lines = song.lyrics ? song.lyrics.split("\n").filter((l) => l.trim()) : [];
  const parsed = lines.map((l) => {
    const m = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/.exec(l.trim());
    if (m) {
      const sec = Number(m[1]) * 60 + Number(m[2]) + Number(m[3] || "0") / 1000;
      return { time: sec, text: m[4] || l.trim(), hasTime: true };
    }
    return { time: 0, text: l.trim(), hasTime: false };
  });
  const lineCount = Math.max(parsed.length, 1);
  const hasTimestamps = parsed.filter((p) => p.hasTime).length > parsed.length / 2;

  // 当前唱到第几行
  const adjusted = Math.max(0, current + offset);
  let activeLine = 0;
  if (duration) {
    if (hasTimestamps) {
      for (let i = 0; i < parsed.length; i++) {
        if (parsed[i].hasTime && adjusted >= parsed[i].time) activeLine = i;
      }
    } else {
      activeLine = Math.min(Math.floor((adjusted / duration) * lineCount), lineCount - 1);
    }
  }

  // 歌词自动滚动：让当前行滚到可视区中间
  useEffect(() => {
    const box = lyricsBoxRef.current;
    if (!box || !duration || lines.length === 0) return;
    const el = box.children[activeLine] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeLine, duration, lines.length]);

  // 频谱动画：全局分析器有数据就用真频谱，没有就装饰兜底
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const BARS = 32;
    const W = 1400;
    const H = 180;
    canvas.width = W;
    canvas.height = H;
    const heights = new Array(BARS).fill(2);
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const gap = 6;
      const bw = (W - gap * (BARS - 1)) / BARS;

      for (let i = 0; i < BARS; i++) {
        let bh: number;

        if (player.analyser && player.freqData && playing) {
          // 🎯 真实频谱：从全局分析器读数
          player.analyser.getByteFrequencyData(player.freqData);
          const raw = player.freqData[i] / 255;
          const target = 6 + raw * (H - 14);
          heights[i] += (target - heights[i]) * 0.5;
          bh = heights[i];
        } else {
          // 🎨 装饰兜底
          if (playing) {
            const target = 10 + Math.random() * (H - 16);
            heights[i] += (target - heights[i]) * 0.35;
          } else {
            heights[i] += (2 - heights[i]) * 0.1;
          }
          bh = heights[i];
        }

        const x = i * (bw + gap);
        // 🌈 按频率上色：低音暖色 → 高音冷色
        const hue = 15 + (i / BARS) * 265;
        const grad = ctx.createLinearGradient(0, H - bh, 0, H);
        grad.addColorStop(0, `hsl(${hue}, 90%, 70%)`);
        grad.addColorStop(1, `hsl(${hue}, 85%, 40%)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, H - bh, bw, bh, 3);
        } else {
          ctx.rect(x, H - bh, bw, bh);
        }
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, player.analyser, player.freqData]);

  // 时间显示：秒 → 分:秒
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ❤️ 收藏/取消收藏（没登录 → 跳登录页）
  const toggleLike = async () => {
    const res = await fetch("/api/song/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: song.id }),
    });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    if (data.ok) setLiked(data.liked);
  };

  // 📤 分享：复制"歌名 + 链接"到剪贴板
  const share = async () => {
    const url = window.location.href;
    const text = `🎵 ${song.title}（${song.genre}）| AizyBase 音乐馆\n${url}`;
    try {
      await navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {}
  };

  // ⏯ 播放/暂停按钮
  const playPause = () => player.toggle();

  // 进度条：点击跳转
  const seekByClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = barRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    player.seek(Math.max(0, Math.min(1, ratio)) * duration);
  };

  // 播放模式按钮
  const modeBtn = (m: "list" | "single" | "shuffle", label: string): React.CSSProperties => ({
    padding: "6px 10px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    background: mode === m ? "linear-gradient(135deg,#f59e0b,#dc2626)" : "transparent",
    color: mode === m ? "#fff" : "var(--text-light)",
    fontWeight: mode === m ? 700 : 400,
  });

  const syncBtn: React.CSSProperties = {
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: "12px",
  };

  return (
    <div>
      {/* 🎵 顶部：旋转唱片封面 + 歌名信息 */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
        <div className={playing ? "disc spinning" : "disc"}>
          {song.cover ? (
            <Image src={song.cover} alt={song.title} width={300} height={300} />
          ) : (
            <div className="disc-fallback">🎧</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: "28px", margin: "8px 0 4px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {song.title}
            <button
              onClick={toggleLike}
              title={liked ? "取消收藏" : "收藏这首歌"}
              style={{ fontSize: "24px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {liked ? "❤️" : "🤍"}
            </button>
            <button
              onClick={share}
              title="分享这首歌"
              style={{ fontSize: "20px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              📤
            </button>
            {shareCopied && (
              <span style={{ fontSize: "12px", color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "3px 8px", borderRadius: "10px" }}>
                ✅ 已复制分享链接！
              </span>
            )}
          </h1>
          <p style={{ color: "var(--text-light)", margin: 0 }}>{song.genre}</p>
          <p style={{ margin: "8px 0 0", fontSize: "13px" }}>
            {song.isOriginal ? (
              <span style={{ color: "#059669" }}>✅ AI 原创</span>
            ) : (
              <span style={{ color: "#92400e" }}>⚠️ 翻唱学习版（不商用）</span>
            )}
          </p>
        </div>
      </div>

      {/* 🌈 频谱动效 */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "90px", marginTop: "20px", display: "block" }}
      />

      {/* 🎛️ 自定义控制条：上一首 / 播放暂停 / 下一首 + 进度条 + 模式 */}
      <div
        style={{
          marginTop: "14px",
          padding: "14px",
          background: "var(--card-bg)",
          borderRadius: "12px",
          border: "1px solid var(--card-border)",
          display: "grid",
          gap: "10px",
        }}
      >
        {/* 进度条（点击跳转）+ 时间 */}
        <div
          ref={barRef}
          onClick={seekByClick}
          style={{ height: "8px", borderRadius: "6px", background: "var(--card-border)", cursor: "pointer", position: "relative", overflow: "hidden" }}
        >
          <div
            style={{
              width: `${duration ? (current / duration) * 100 : 0}%`,
              height: "100%",
              borderRadius: "6px",
              background: "linear-gradient(90deg,#f59e0b,#dc2626)",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-light)" }}>
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>

        {/* 按钮行 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: "8px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => player.prev()}
              disabled={!player.queue.length}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: player.queue.length ? "pointer" : "not-allowed",
                opacity: player.queue.length ? 1 : 0.4,
                background: "linear-gradient(135deg,#f59e0b,#dc2626)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              ⏮ 上一首
            </button>
            {/* ⏯ 播放/暂停 大按钮 */}
            <button
              onClick={playPause}
              title={playing ? "暂停" : "播放"}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg,#f59e0b,#dc2626)",
                color: "#fff",
                fontSize: "22px",
                boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
              }}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              onClick={() => player.next()}
              disabled={!player.queue.length}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: player.queue.length ? "pointer" : "not-allowed",
                opacity: player.queue.length ? 1 : 0.4,
                background: "linear-gradient(135deg,#f59e0b,#dc2626)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              下一首 ⏭
            </button>
          </div>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <button onClick={() => player.setMode("list")} style={modeBtn("list", "🔁")} title="列表循环">🔁</button>
            <button onClick={() => player.setMode("single")} style={modeBtn("single", "🔂")} title="单曲循环">🔂</button>
            <button onClick={() => player.setMode("shuffle")} style={modeBtn("shuffle", "🔀")} title="随机播放">🔀</button>
          </div>
        </div>
      </div>

      {/* 📜 歌词滚动面板 */}
      {lines.length > 0 ? (
        <div style={{ marginTop: "28px", borderTop: "1px solid var(--card-border)", paddingTop: "16px" }}>
          <h2 style={{ fontSize: "18px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            📜 歌词 <span style={{ color: "var(--text-light)", fontSize: "12px", fontWeight: "normal" }}>{fmt(current)} / {fmt(duration)}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "auto", fontSize: "12px" }}>
              <button onClick={() => setOffset((o) => Math.max(-10, o - 0.5))} title="歌词提前 0.5 秒" style={syncBtn}>⏪ -0.5</button>
              <span style={{ color: "var(--text-light)", minWidth: "42px", textAlign: "center" }}>{offset > 0 ? `+${offset.toFixed(1)}s` : `${offset.toFixed(1)}s`}</span>
              <button onClick={() => setOffset((o) => Math.min(10, o + 0.5))} title="歌词延后 0.5 秒" style={syncBtn}>+0.5 ⏩</button>
              <button onClick={() => setOffset(0)} title="复位" style={syncBtn}>🔄</button>
            </span>
          </h2>
          <div
            ref={lyricsBoxRef}
            style={{
              maxHeight: "360px",
              overflowY: "auto",
              lineHeight: 2.2,
              fontSize: "15px",
              padding: "10px 12px",
              background: "var(--card-bg)",
              borderRadius: "12px",
            }}
          >
            {parsed.map((p, i) => (
              <div
                key={i}
                onClick={() => {
                  player.seek(hasTimestamps && p.hasTime ? p.time : (i / lineCount) * duration);
                  if (player.playing === false) player.toggle();
                }}
                style={{
                  color: i === activeLine ? "#f59e0b" : "var(--text)",
                  fontWeight: i === activeLine ? 700 : 400,
                  transform: i === activeLine ? "scale(1.06)" : "scale(1)",
                  transformOrigin: "left center",
                  transition: "color .2s, transform .2s",
                  padding: "2px 4px",
                  cursor: "pointer",
                  borderRadius: "6px",
                }}
              >
                {p.text}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ marginTop: "28px", color: "var(--text-light)" }}>
          🎵 这首歌还没有歌词，专心听旋律吧～
        </p>
      )}

      {/* 唱片旋转动画 + 手机端适配 */}
      <style jsx>{`
        .disc {
          border-radius: 12px;
          overflow: hidden;
          width: 300px;
          height: 300px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
          flex-shrink: 0;
        }
        .disc img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .disc-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: #fff;
          font-size: 64px;
        }
        .disc.spinning img {
          animation: disc-spin 8s linear infinite;
        }
        .disc.spinning .disc-fallback {
          animation: disc-spin 8s linear infinite;
        }
        @keyframes disc-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 600px) {
          .disc { width: 200px; height: 200px; }
          .disc-fallback { font-size: 48px; }
        }
      `}</style>
    </div>
  );
}
