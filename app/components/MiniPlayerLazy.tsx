// app/components/MiniPlayerLazy.tsx
// 第 19 课：迷你条"按需加载"包装层
// next/dynamic 的 ssr:false 只能在客户端组件里用，所以包一层 "use client"
"use client";
import dynamic from "next/dynamic";

const MiniPlayer = dynamic(() => import("./MiniPlayer"), { ssr: false });

export default function MiniPlayerLazy() {
  return <MiniPlayer />;
}
