// app/message/LikeBtn.tsx
// 点赞按钮（客户端组件：点击后即时变化，不需要整页刷新）
"use client";
import { useState } from "react";
import { toggleMessageLike } from "../actions/messageLikeAction";
import { useToast } from "@/app/components/Toast";

export default function LikeBtn({
  messageId,
  likeCount,
  liked,
  isLoggedIn,
}: {
  messageId: string;
  likeCount: number;
  liked: boolean;
  isLoggedIn: boolean;
}) {
  // 初始状态由服务器传进来（防止刷新后丢失）
  const [count, setCount] = useState(likeCount);
  const [isLiked, setIsLiked] = useState(liked);
  // 弹窗提示工具
  const { showToast } = useToast();

  // 点击：调用服务器端的点赞/取消点赞逻辑
  async function handleClick() {
    if (!isLoggedIn) {
      showToast("请先登录再点赞", "err");
      return;
    }
    const res = await toggleMessageLike(messageId);
    if (!res.success) {
      showToast(res.msg || "操作失败", "err");
      return;
    }

    setIsLiked(res.isLike);
    setCount((c) => (res.isLike ? c + 1 : c - 1));
    // 弹出提示
    showToast(res.isLike ? "点赞成功！" : "已取消点赞", "ok");
  }

  // 未登录：只显示数字，不能点击
  if (!isLoggedIn) {
    return <span style={{ fontSize: 14, color: "#666" }}>👍 {count}</span>;
  }

  // 已登录：可点击，点赞后变蓝色
  return (
    <button
      onClick={handleClick}
      style={{
        fontSize: 14,
        border: "none",
        background: "transparent",
        color: isLiked ? "#2563eb" : "#666",
        cursor: "pointer",
        padding: 0,
      }}
    >
      👍 {count}
    </button>
  );
}
