"use client";
import { useEffect } from "react";

// 阅读量计数器（看不见的组件）：页面打开时通知服务器"我看了这篇"
export default function ViewCounter({ blogId }: { blogId: string }) {
  useEffect(() => {
    // 页面打开 → 告诉服务器"我看了这篇"（服务器判断该不该+1）
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: blogId }),
    }).catch(() => {});
  }, [blogId]); // 只有 blogId 变化时才执行（切文章才重新触发）

  return null; // 不显示任何东西，纯功能组件
}
