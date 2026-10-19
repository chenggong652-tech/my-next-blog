"use client";
// app/components/PlayerProvider.tsx
// 🎵 全局播放器内核：全站共享一个音频 + 播放状态（Context 状态提升）
// 所有页面都能通过 usePlayer() 控制播放——第 28 课的全站迷你条就挂在它上面

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

// 一首歌的完整信息（播放器要用的字段）
export type QueueSong = {
  id: string;
  title: string;
  genre: string;
  cover: string | null;
  audioUrl: string;
  isOriginal: boolean;
  lyrics: string | null;
  plays: number;
};

// 全局播放器对外提供的"遥控器"（函数 = 动作，数值 = 状态）
type PlayerCtx = {
  song: QueueSong | null;
  queue: QueueSong[];
  index: number;
  playing: boolean;
  current: number;
  duration: number;
  mode: "list" | "single" | "shuffle";
  analyser: AnalyserNode | null; // 真实频谱分析器（全站共用一个）
  freqData: Uint8Array<ArrayBuffer> | null; // 频域数据缓冲
  initSong: (song: QueueSong, queue: QueueSong[]) => void; // 设置当前歌（不自动播）
  playSong: (song: QueueSong, queue: QueueSong[]) => void; // 直接开播
  toggle: () => void; // 播放/暂停
  next: () => void; // 下一首
  prev: () => void; // 上一首
  seek: (t: number) => void; // 跳转到某秒
  setMode: (m: "list" | "single" | "shuffle") => void; // 播放模式
  volume: number; // 音量（0~1）
  setVolume: (v: number) => void; // 调音量
};

const Ctx = createContext<PlayerCtx | null>(null);
export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer 必须在 PlayerProvider 内使用");
  return c;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [song, setSong] = useState<QueueSong | null>(null);
  const [queue, setQueue] = useState<QueueSong[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mode, setModeState] = useState<"list" | "single" | "shuffle">("list");
  const [volume, setVolumeState] = useState(1); // 音量（0~1），默认满格
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [freqData, setFreqData] = useState<Uint8Array<ArrayBuffer> | null>(null);
  const reported = useRef(false); // 防重复计数
  const ctxRef = useRef<AudioContext | null>(null); // 音频上下文（播放前要唤醒）

  // 用 ref 镜像最新值（事件回调里能读到最新状态，不闭包过期）
  const songRef = useRef(song); songRef.current = song;
  const queueRef = useRef(queue); queueRef.current = queue;
  const indexRef = useRef(index); indexRef.current = index;
  const modeRef = useRef(mode); modeRef.current = mode;

  // 初始化真实频谱：给全局 audio 接上分析器
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      type WAC = typeof window & { webkitAudioContext?: typeof AudioContext };
      const Ctor = window.AudioContext ?? (window as WAC).webkitAudioContext;
      if (!Ctor) throw new Error("no AudioContext");
      const ctx = new Ctor();
      const a = ctx.createAnalyser();
      a.fftSize = 64;
      const source = ctx.createMediaElementSource(audio);
      source.connect(a);
      a.connect(ctx.destination);
      ctxRef.current = ctx; // 记住上下文，播放前唤醒
      setAnalyser(a);
      setFreqData(new Uint8Array(new ArrayBuffer(a.frequencyBinCount)));
    } catch {
      // 老浏览器：没有频谱，播放照常
    }
  }, []);

  // 🔊 音量：打开页面时恢复上次的设置，之后每次调整都同步给 audio
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem("playerVolume") || "1");
      setVolumeState(isNaN(v) ? 1 : Math.max(0, Math.min(1, v)));
    } catch {}
  }, []);
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
  }, [volume]);

  // 唤醒音频上下文（浏览器自动播放策略会挂起它，播放前必须 resume）
  const resumeCtx = () => {
    const c = ctxRef.current;
    if (c && c.state === "suspended") c.resume();
  };

  // 切到某首歌（id 在队列里找）
  const goTo = (targetId: string | null) => {
    if (!targetId) return;
    const i = queueRef.current.findIndex((s) => s.id === targetId);
    if (i < 0) return;
    setIndex(i);
    setSong(queueRef.current[i]); // 🐛 修复：切歌时必须同步"当前歌"（否则页面标题/封面/歌词不跟随）
    const a = audioRef.current;
    if (a) {
      resumeCtx();
      a.src = queueRef.current[i].audioUrl;
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  };

  // 一首放完 → 按模式分流（🔂单曲 / 🔀随机 / 🔁列表循环）
  const handleEnded = () => {
    const m = modeRef.current;
    const a = audioRef.current;
    if (m === "single") {
      if (a) { a.currentTime = 0; a.play(); }
      return;
    }
    const q = queueRef.current;
    const i = indexRef.current;
    if (m === "shuffle" && q.length > 1) {
      const others = q.filter((_, x) => x !== i);
      goTo(others[Math.floor(Math.random() * others.length)].id);
      return;
    }
    goTo(q[i + 1]?.id ?? q[0]?.id ?? null);
  };

  // 播放上报：播放次数 +1 + 记最近播放
  const reportPlay = (s: QueueSong) => {
    fetch("/api/song/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id }),
    }).catch(() => {});
    try {
      const prev: { id: string; title: string; cover: string | null }[] = JSON.parse(
        localStorage.getItem("recentSongs") || "[]"
      );
      const next = [{ id: s.id, title: s.title, cover: s.cover }, ...prev.filter((x) => x.id !== s.id)].slice(0, 6);
      localStorage.setItem("recentSongs", JSON.stringify(next));
    } catch {}
  };

  const value: PlayerCtx = {
    song,
    queue,
    index,
    playing,
    current,
    duration,
    mode,
    analyser,
    freqData,
    // 设置当前歌但不自动播（打开播放页时用）
    initSong: (s, q) => {
      const i = q.findIndex((x) => x.id === s.id);
      setSong(s);
      setQueue(q);
      setIndex(i >= 0 ? i : 0);
      reported.current = false;
      const a = audioRef.current;
      if (a && a.src !== s.audioUrl) {
        a.src = s.audioUrl;
        a.load();
      }
    },
    // 直接开播（迷你条点歌时用）
    playSong: (s, q) => {
      const i = q.findIndex((x) => x.id === s.id);
      setSong(s);
      setQueue(q);
      setIndex(i >= 0 ? i : 0);
      reported.current = false;
      const a = audioRef.current;
      if (a) {
        resumeCtx();
        a.src = s.audioUrl;
        a.currentTime = 0;
        a.play().catch(() => {});
      }
    },
    toggle: () => {
      const a = audioRef.current;
      if (!a) return;
      if (a.paused) {
        resumeCtx();
        a.play().catch(() => {});
        if (!reported.current && songRef.current) {
          reported.current = true;
          reportPlay(songRef.current);
        }
      } else {
        a.pause();
      }
    },
    next: () => goTo(queueRef.current[indexRef.current + 1]?.id ?? null),
    prev: () => goTo(queueRef.current[indexRef.current - 1]?.id ?? null),
    seek: (t) => {
      const a = audioRef.current;
      if (a) a.currentTime = t;
    },
    setMode: (m) => setModeState(m),
    volume,
    setVolume: (v) => {
      const n = Math.max(0, Math.min(1, v));
      setVolumeState(n);
      const a = audioRef.current;
      if (a) a.volume = n;
      try { localStorage.setItem("playerVolume", String(n)); } catch {}
    },
  };

  return (
    <Ctx.Provider value={value}>
      {/* 全站唯一的音频元素（无控件，隐身工作，控制权交给 UI） */}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
      />
      {children}
    </Ctx.Provider>
  );
}
