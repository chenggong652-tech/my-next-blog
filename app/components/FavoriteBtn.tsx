"use client";
import { useState } from "react";

// 收藏按钮：点一下收藏、再点取消（即时变化）
export default function FavoriteBtn({
  blogId,
  initialFavorited,
  initialCount,
}: {
  blogId: string;
  initialFavorited: boolean;
  initialCount: number;
}) {
  // 三个状态：是否已收藏、收藏总数、是否请求中（防连点）
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return; // 请求中不再响应，防连点
    setLoading(true);
    try {
      const res = await fetch("/api/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId }),
      });
      const data = await res.json();
      if (data.ok) {
        setFavorited(data.favorited); // 换成服务器给的最新状态
        setCount(data.count); // 换成最新总数
      }
    } catch {}
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        padding: "4px 12px",
        borderRadius: "8px",
        border: "1px solid var(--card-border)",
        background: favorited ? "#fef2f2" : "transparent",
        color: favorited ? "#dc2626" : "var(--text)",
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      {favorited ? "❤️ 已收藏" : "🤍 收藏"}（{count}）
    </button>
  );
}
