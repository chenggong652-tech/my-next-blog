"use client";
// app/music/[id]/MusicPlayer.tsx
// 音乐 App 四件套：旋转唱片封面 + 频谱动效 + 歌词滚动 + 歌单连播

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Song = {
  id: string;
  title: string;
  genre: string;
  cover: string | null;
  audioUrl: string;
  isOriginal: boolean;
  lyrics: string | null;
};

export default function MusicPlayer({
  song,
  prevId,
  nextId,
  position,
  total,
  allIds,
  liked: likedInit,
}: {
  song: Song;
  prevId: string | null;
  nextId: string | null;
  position: number;
  total: number;
  allIds: string[];
  liked: boolean;
}) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lyricsBoxRef = useRef<HTMLDivElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);   // 当前播放秒数
  const [duration, setDuration] = useState(0); // 歌曲总时长秒数
  const [mode, setMode] = useState<"list" | "single" | "shuffle">("list"); // 播放模式
  const [liked, setLiked] = useState(likedInit); // ❤️ 收藏状态
  const [shareCopied, setShareCopied] = useState(false); // 📤 "已复制"提示
  const reported = useRef(false); // 防重复计数：同一次打开页面只报 1 次
  const analyserRef = useRef<AnalyserNode | null>(null); // 音频分析器（真频谱）
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null); // 频域数据缓冲区
  const useFallback = useRef(false); // 浏览器不支持时退回装饰动画

  // 🔧 初始化真实频谱：把播放器的声音"分一根线"给分析器
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      type WAC = typeof window & { webkitAudioContext?: typeof AudioContext };
      const Ctor = window.AudioContext ?? (window as WAC).webkitAudioContext;
      if (!Ctor) throw new Error("浏览器不支持 AudioContext");
      const ctx = new Ctor();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // 64 个采样点 → 32 个频段（正好一根柱子一个频段）
      // 关键一步：把 audio 元素的输出"接"进分析器（接完还要接回音箱，否则没声音）
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      freqDataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    } catch {
      useFallback.current = true; // 老浏览器/异常 → 用装饰动画兜底
    }
  }, []);

  // 歌词按行切分（去掉空行）
  const lines = song.lyrics ? song.lyrics.split("\n").filter((l) => l.trim()) : [];
  const lineCount = Math.max(lines.length, 1);

  // 当前唱到第几行：把总时长平均分给每一行
  const activeLine = duration
    ? Math.min(Math.floor((current / duration) * lineCount), lineCount - 1)
    : 0;

  // 歌词自动滚动：让当前行滚到可视区中间
  useEffect(() => {
    const box = lyricsBoxRef.current;
    if (!box || !duration || lines.length === 0) return;
    const el = box.children[activeLine] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeLine, duration, lines.length]);

  // 频谱动画：能拿到真实频率就用真数据，拿不到就随机装饰
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const BARS = 32;
    const W = 1400;  // 画布真实像素（高清）
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

        if (!useFallback.current && analyserRef.current && freqDataRef.current && playing) {
          // 🎯 真实频谱：从歌曲实时频率里取这个频段的强度（0~255）
          analyserRef.current.getByteFrequencyData(freqDataRef.current);
          const raw = freqDataRef.current[i] / 255; // 归一化成 0~1
          const target = 6 + raw * (H - 14);
          heights[i] += (target - heights[i]) * 0.5; // 平滑过渡，不闪瞎眼
          bh = heights[i];
        } else {
          // 🎨 装饰兜底：播放时随机蹦跶，暂停回落（老浏览器专用）
          if (playing) {
            const target = 10 + Math.random() * (H - 16);
            heights[i] += (target - heights[i]) * 0.35;
          } else {
            heights[i] += (2 - heights[i]) * 0.1;
          }
          bh = heights[i];
        }

        const x = i * (bw + gap);

        // 🌈 按频率上色：低音柱子暖色（红橙），高音柱子冷色（紫蓝），中间彩虹过渡
        const hue = 15 + (i / BARS) * 265; // 色相：15°红橙 → 280°紫
        const grad = ctx.createLinearGradient(0, H - bh, 0, H);
        grad.addColorStop(0, `hsl(${hue}, 90%, 70%)`); // 顶部亮色
        grad.addColorStop(1, `hsl(${hue}, 85%, 40%)`); // 底部深色
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
  }, [playing]);

  // 时间显示：秒 → 分:秒
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // 切歌：跳转到上一首/下一首
  const goTo = (targetId: string | null) => {
    if (targetId) router.push(`/music/${targetId}`);
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

  // 📤 分享：复制"歌名 + 链接"到剪贴板，方便发朋友/群
  const share = async () => {
    const url = window.location.href;
    const text = `🎵 ${song.title}（${song.genre}）| AizyBase 音乐馆\n${url}`;
    try {
      await navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {}
  };

  // 一首放完该干嘛？按模式分流
  const handleEnded = () => {
    if (mode === "single") {
      // 🔂 单曲循环：重头再播这一首
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        a.play();
      }
      return;
    }
    if (mode === "shuffle" && allIds.length > 1) {
      // 🔀 随机：从歌单里随机挑一首（不挑自己）
      const others = allIds.filter((x) => x !== song.id);
      goTo(others[Math.floor(Math.random() * others.length)]);
      return;
    }
    // 🔁 列表循环：有下一首就下一首，最后一首回到第一首
    goTo(nextId ?? allIds[0] ?? null);
  };

  // 播放模式按钮的通用长相
  const modeBtn = (m: "list" | "single" | "shuffle", label: string, title: string): React.CSSProperties => ({
    padding: "6px 10px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    background: mode === m ? "linear-gradient(135deg,#f59e0b,#dc2626)" : "transparent",
    color: mode === m ? "#fff" : "var(--text-light)",
    fontWeight: mode === m ? 700 : 400,
  });

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
            {/* ❤️ 收藏按钮：红心=已收藏，白心=没收藏 */}
            <button
              onClick={toggleLike}
              title={liked ? "取消收藏" : "收藏这首歌"}
              style={{ fontSize: "24px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {liked ? "❤️" : "🤍"}
            </button>
            {/* 📤 分享按钮：复制链接给朋友 */}
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

      {/* 🔊 播放控制（原生控件，稳定兼容手机） */}
      <audio
        ref={audioRef}
        controls
        src={song.audioUrl}
        preload="metadata"
        style={{ width: "100%", marginTop: "12px" }}
        onPlay={() => {
          setPlaying(true);
          // 📊 播放计数：第一次播放时通知接口 +1（同页面不重复）
          if (!reported.current) {
            reported.current = true;
            fetch("/api/song/play", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: song.id }),
            }).catch(() => {});
          }
          // 🕘 记下"最近播放"：存在浏览器本地，下次打开音乐馆首页能看见（最多 6 首，去重）
          try {
            const prev: { id: string; title: string; cover: string | null }[] = JSON.parse(
              localStorage.getItem("recentSongs") || "[]"
            );
            const next = [
              { id: song.id, title: song.title, cover: song.cover },
              ...prev.filter((x) => x.id !== song.id),
            ].slice(0, 6);
            localStorage.setItem("recentSongs", JSON.stringify(next));
          } catch {}
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded} // 一首放完 → 按播放模式分流
      />

      {/* ⏮ 歌单连播控制条 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          rowGap: "8px",
          marginTop: "12px",
          padding: "10px 14px",
          background: "var(--card-bg)",
          borderRadius: "12px",
          border: "1px solid var(--card-border)",
        }}
      >
        <button
          onClick={() => goTo(prevId)}
          disabled={!prevId}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            border: "none",
            cursor: prevId ? "pointer" : "not-allowed",
            opacity: prevId ? 1 : 0.4,
            background: "linear-gradient(135deg,#f59e0b,#dc2626)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          ⏮ 上一首
        </button>
        <span style={{ color: "var(--text-light)", fontSize: "13px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <span>🎶 第 {position} / {total} 首</span>
          {/* 🔁 播放模式切换：列表循环 / 单曲循环 / 随机 */}
          <span style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => setMode("list")} style={modeBtn("list", "🔁", "列表循环")} title="列表循环">🔁</button>
            <button onClick={() => setMode("single")} style={modeBtn("single", "🔂", "单曲循环")} title="单曲循环">🔂</button>
            <button onClick={() => setMode("shuffle")} style={modeBtn("shuffle", "🔀", "随机播放")} title="随机播放">🔀</button>
          </span>
        </span>
        <button
          onClick={() => goTo(nextId)}
          disabled={!nextId}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            border: "none",
            cursor: nextId ? "pointer" : "not-allowed",
            opacity: nextId ? 1 : 0.4,
            background: "linear-gradient(135deg,#f59e0b,#dc2626)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          下一首 ⏭
        </button>
      </div>

      {/* 📜 歌词滚动面板 */}
      {lines.length > 0 ? (
        <div style={{ marginTop: "28px", borderTop: "1px solid var(--card-border)", paddingTop: "16px" }}>
          <h2 style={{ fontSize: "18px" }}>
            📜 歌词 <span style={{ color: "var(--text-light)", fontSize: "12px", fontWeight: "normal" }}>{fmt(current)} / {fmt(duration)}</span>
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
            {lines.map((line, i) => (
              <div
                key={i}
                style={{
                  color: i === activeLine ? "#f59e0b" : "var(--text)",
                  fontWeight: i === activeLine ? 700 : 400,
                  transform: i === activeLine ? "scale(1.06)" : "scale(1)",
                  transformOrigin: "left center",
                  transition: "color .2s, transform .2s",
                  padding: "2px 4px",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ marginTop: "28px", color: "var(--text-light)" }}>
          🎵 这首歌还没有歌词，专心听旋律吧～
        </p>
      )}

      {/* 唱片旋转动画 */}
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
