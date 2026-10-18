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

  // 打开页面时：直接自动播放这首歌，并读回上次的歌词偏移
  useEffect(() => {
    player.playSong(song, allSongs);
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

  const { playing, current, duration, mode, volume, setVolume } = player;

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

  // 🎯 没有时间戳的歌：按"字数"给每句分配预计开始时间（长句唱得久，短句唱得快）
  // 比"平均分"更贴合真实唱歌节奏，歌词才能跟上
  const weights = parsed.map((p) => Math.max(p.text.length, 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const lineStartAt = (i: number) =>
    (weights.slice(0, i).reduce((a, b) => a + b, 0) / Math.max(totalWeight, 1)) * (duration || 0);

  // 当前唱到第几行
  const adjusted = Math.max(0, current + offset);
  let activeLine = 0;
  if (duration) {
    if (hasTimestamps) {
      for (let i = 0; i < parsed.length; i++) {
        if (parsed[i].hasTime && adjusted >= parsed[i].time) activeLine = i;
      }
    } else {
      // 按字数权重的逐句对齐：唱到哪句就高亮哪句
      for (let i = 0; i < parsed.length; i++) {
        if (adjusted >= lineStartAt(i)) activeLine = i;
      }
    }
  }

  // 歌词自动滚动：只滚动歌词面板容器（不碰页面）——把当前行滚到容器中间
  useEffect(() => {
    const box = lyricsBoxRef.current;
    if (!box || !duration || lines.length === 0) return;
    const el = box.children[activeLine] as HTMLElement | undefined;
    if (!el) return;
    // 🎯 关键：scrollTo 只滚歌词框自己，页面保持不动
    const target = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
    box.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
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
    background: mode === m ? "linear-gradient(135deg,#f59e0b,#dc2626)" : "rgba(255,255,255,0.08)",
    color: mode === m ? "#fff" : "rgba(245,243,255,0.7)",
    fontWeight: mode === m ? 700 : 400,
  });

  const syncBtn: React.CSSProperties = {
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(245,243,255,0.8)",
    cursor: "pointer",
    fontSize: "12px",
  };

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "28px",
        padding: "44px",
        background: "linear-gradient(135deg,#312e81 0%,#6d28d9 48%,#be185d 100%)",
        color: "#f5f3ff",
      }}
    >
      {/* 🎆 KTV 氛围光斑（更亮更大气） */}
      <div
        style={{
          position: "absolute",
          top: "-140px",
          left: "-100px",
          width: "520px",
          height: "520px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(217,70,239,0.5), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-140px",
          right: "-100px",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251,191,36,0.35), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "58%",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244,114,182,0.3), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* 🎵 顶部：旋转唱片封面 + 歌名信息 */}
      <div style={{ display: "flex", alignItems: "center", gap: "40px", flexWrap: "wrap", position: "relative" }}>
        {/* 封面 + 背后舞台放射光 */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              position: "absolute",
              inset: "-40px",
              borderRadius: "50%",
              background:
                "conic-gradient(from 0deg, rgba(217,70,239,0.5), rgba(59,130,246,0.35), rgba(251,191,36,0.4), rgba(217,70,239,0.5))",
              filter: "blur(28px)",
              pointerEvents: "none",
              animation: "ktv-beam 6s linear infinite",
            }}
          />
          <div className={playing ? "disc spinning ktv-glow" : "disc ktv-glow"}>
            {song.cover ? (
              <Image src={song.cover} alt={song.title} width={380} height={380} />
            ) : (
              <div className="disc-fallback">🎧</div>
            )}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h1
            style={{
              fontSize: "42px",
              margin: "8px 0 6px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              textShadow: "0 0 28px rgba(233,213,255,0.95), 0 0 70px rgba(217,70,239,0.5)",
              color: "#fff",
              fontWeight: 800,
            }}
          >
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
          <p style={{ color: "rgba(245,243,255,0.6)", margin: 0 }}>{song.genre}</p>
          <p style={{ margin: "8px 0 0", fontSize: "13px" }}>
            {song.isOriginal ? (
              <span style={{ color: "#6ee7b7", background: "rgba(16,185,129,0.15)", padding: "3px 10px", borderRadius: "999px" }}>✅ AI 原创</span>
            ) : (
              <span style={{ color: "#fbbf24", background: "rgba(245,158,11,0.15)", padding: "3px 10px", borderRadius: "999px" }}>⚠️ 翻唱学习版（不商用）</span>
            )}
          </p>
        </div>
      </div>

      {/* 🌈 频谱动效 */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "110px", marginTop: "26px", display: "block" }}
      />

      {/* 🎛️ 自定义控制条：上一首 / 播放暂停 / 下一首 + 进度条 + 模式 */}
      <div
        style={{
          marginTop: "18px",
          padding: "18px",
          background: "rgba(0,0,0,0.28)",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(10px)",
          display: "grid",
          gap: "12px",
          position: "relative",
        }}
      >
        {/* 进度条（点击跳转）+ 时间 */}
        <div
          ref={barRef}
          onClick={seekByClick}
          style={{ height: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.2)", cursor: "pointer", position: "relative", overflow: "hidden" }}
        >
          <div
            style={{
              width: `${duration ? (current / duration) * 100 : 0}%`,
              height: "100%",
              borderRadius: "8px",
              background: "linear-gradient(90deg,#fde68a,#f59e0b,#dc2626)",
              boxShadow: "0 0 16px rgba(245,158,11,0.7)",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "rgba(245,243,255,0.7)" }}>
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>

        {/* 按钮行 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: "8px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={() => player.prev()}
              disabled={!player.queue.length}
              style={{
                padding: "11px 22px",
                borderRadius: "999px",
                border: "none",
                cursor: player.queue.length ? "pointer" : "not-allowed",
                opacity: player.queue.length ? 1 : 0.4,
                background: "linear-gradient(135deg,#f59e0b,#dc2626)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "15px",
                boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
              }}
            >
              ⏮ 上一首
            </button>
            {/* ⏯ 播放/暂停 大按钮 */}
            <button
              onClick={playPause}
              title={playing ? "暂停" : "播放"}
              style={{
                width: "62px",
                height: "62px",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg,#f59e0b,#dc2626)",
                color: "#fff",
                fontSize: "26px",
                boxShadow: "0 6px 22px rgba(245,158,11,0.45)",
              }}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              onClick={() => player.next()}
              disabled={!player.queue.length}
              style={{
                padding: "11px 22px",
                borderRadius: "999px",
                border: "none",
                cursor: player.queue.length ? "pointer" : "not-allowed",
                opacity: player.queue.length ? 1 : 0.4,
                background: "linear-gradient(135deg,#f59e0b,#dc2626)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "15px",
                boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
              }}
            >
              下一首 ⏭
            </button>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            {/* 🔊 音量：点图标静音/恢复，拖滑块调大小（记忆上次音量） */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 1)}
                title={volume > 0 ? "静音" : "恢复音量"}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", padding: "4px" }}
              >
                {volume > 0 ? "🔊" : "🔇"}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                title="音量"
                style={{ width: "90px", accentColor: "#f59e0b", cursor: "pointer" }}
              />
            </div>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button onClick={() => player.setMode("list")} style={modeBtn("list", "🔁")} title="列表循环">🔁</button>
              <button onClick={() => player.setMode("single")} style={modeBtn("single", "🔂")} title="单曲循环">🔂</button>
              <button onClick={() => player.setMode("shuffle")} style={modeBtn("shuffle", "🔀")} title="随机播放">🔀</button>
            </div>
          </div>
        </div>
      </div>

      {/* 📜 歌词滚动面板（KTV 大屏风） */}
      {lines.length > 0 ? (
        <div style={{ marginTop: "28px", borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "16px", position: "relative" }}>
          <h2 style={{ fontSize: "18px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", color: "#f5f3ff" }}>
            📜 歌词 <span style={{ color: "rgba(245,243,255,0.5)", fontSize: "12px", fontWeight: "normal" }}>{fmt(current)} / {fmt(duration)}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "auto", fontSize: "12px" }}>
              <button onClick={() => setOffset((o) => Math.max(-10, o - 0.5))} title="歌词提前 0.5 秒" style={syncBtn}>⏪ -0.5</button>
              <span style={{ color: "rgba(245,243,255,0.5)", minWidth: "42px", textAlign: "center" }}>{offset > 0 ? `+${offset.toFixed(1)}s` : `${offset.toFixed(1)}s`}</span>
              <button onClick={() => setOffset((o) => Math.min(10, o + 0.5))} title="歌词延后 0.5 秒" style={syncBtn}>+0.5 ⏩</button>
              <button onClick={() => setOffset(0)} title="复位" style={syncBtn}>🔄</button>
            </span>
          </h2>
          <div
            ref={lyricsBoxRef}
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              position: "relative", // 让歌词行的 offsetTop 以本容器为参照（滚动计算才准）
              textAlign: "center", // 🎤 KTV 大屏：歌词居中
              lineHeight: 2.8,
              fontSize: "17px", // 宽屏下字大一点，横向舒展
              padding: "18px 14px",
              background: "rgba(0,0,0,0.32)",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {parsed.map((p, i) => {
              const isActive = i === activeLine;
              // 🎤 卡拉OK 逐字进度：这一句已经"唱到百分之几"
              let prog = 0;
              if (isActive && duration) {
                const st = hasTimestamps && p.hasTime ? p.time : lineStartAt(i);
                const nx = parsed[i + 1];
                const en = nx
                  ? (hasTimestamps && nx.hasTime ? nx.time : lineStartAt(i + 1))
                  : duration;
                prog = Math.max(0, Math.min(1, (adjusted - st) / Math.max(0.01, en - st)));
              }
              return (
                <div
                  key={i}
                  onClick={() => {
                    player.seek(hasTimestamps && p.hasTime ? p.time : lineStartAt(i));
                    if (player.playing === false) player.toggle();
                  }}
                  style={{
                    transform: isActive ? "scale(1.08)" : "scale(1)",
                    transformOrigin: "center",
                    transition: "transform .25s",
                    padding: "2px 4px",
                    cursor: "pointer",
                    borderRadius: "8px",
                  }}
                >
                  {isActive ? (
                    // 🎤 正在唱的这一句：金色字跟着唱词逐字点亮（卡拉OK效果）
                    <span
                      style={{
                        position: "relative",
                        display: "inline-block",
                        whiteSpace: "nowrap",
                        fontSize: 24,
                        fontWeight: 700,
                        maxWidth: "100%",
                      }}
                    >
                      <span style={{ color: "rgba(245,243,255,0.45)" }}>{p.text}</span>
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          color: "#fbbf24",
                          width: `${prog * 100}%`,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textShadow: "0 0 18px rgba(251,191,36,0.85), 0 0 45px rgba(251,191,36,0.4)",
                        }}
                      >
                        {p.text}
                      </span>
                    </span>
                  ) : (
                    <span style={{ fontSize: 17, color: "rgba(245,243,255,0.45)" }}>{p.text}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p style={{ marginTop: "28px", color: "rgba(245,243,255,0.5)" }}>
          🎵 这首歌还没有歌词，专心听旋律吧～
        </p>
      )}

      {/* 唱片旋转动画 + 手机端适配 */}
      <style jsx>{`
        .disc {
          border-radius: 16px;
          overflow: hidden;
          width: 380px;
          height: 380px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
          flex-shrink: 0;
          position: relative;
        }
        .ktv-glow {
          box-shadow: 0 0 40px rgba(217, 70, 239, 0.55), 0 0 110px rgba(217, 70, 239, 0.3),
            0 8px 30px rgba(0, 0, 0, 0.35) !important;
          border: 2px solid rgba(255, 255, 255, 0.25);
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
        @keyframes ktv-beam {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 600px) {
          .disc { width: 240px; height: 240px; }
          .disc-fallback { font-size: 48px; }
        }
      `}</style>
    </div>
  );
}
