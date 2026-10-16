"use client";

import { useState } from "react";

// 评论点赞按钮：点一下点赞、再点取消（即时变化）
export default function CommentLikeBtn({
  commentId,
  initialLiked,
  initialCount,
}: {
  commentId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  // 三个状态：是否已赞、点赞总数、是否请求中（防连点）
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return; // 防连点：请求中不响应
    setLoading(true);
    const res = await fetch("/api/comment-like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    const data = await res.json();
    if (data.ok) {
      setLiked(data.liked); // 换成服务器给的最新状态
      setCount(data.count);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      style={{
        fontSize: 13,
        border: "1px solid #2563eb",
        background: liked ? "#2563eb" : "transparent",
        color: liked ? "#fff" : "#2563eb",
        borderRadius: 999,
        padding: "2px 12px",
        cursor: "pointer",
      }}
    >
      {liked ? "👍 已赞" : "👍 点赞"}（{count}）
    </button>
  );
}
