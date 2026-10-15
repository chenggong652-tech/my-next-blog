"use client";

import { useEffect, useState } from "react";

// 阅读进度条：文章顶部一条细线，往下滚跟着变长
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0); // 进度 0~100

  useEffect(() => {
    // 滚动时计算进度
    function onScroll() {
      const total = document.documentElement.scrollHeight - window.innerHeight; // 总共能滚多远
      const scrolled = window.scrollY; // 已经滚了多远
      setProgress(total > 0 ? (scrolled / total) * 100 : 0); // 百分比
    }
    window.addEventListener("scroll", onScroll); // 挂上耳朵：每次滚动叫我
    onScroll(); // 刚进页面先算一次
    return () => window.removeEventListener("scroll", onScroll); // 离开页面摘掉耳朵（防内存泄漏）
  }, []);

  return (
    <div
      style={{
        position: "fixed", // 固定贴在屏幕最顶部
        top: 0,
        left: 0,
        width: `${progress}%`, // 宽度 = 进度
        height: "4px",
        background: "var(--link)",
        zIndex: 9999,
        transition: "width 0.1s",
      }}
    />
  );
}
