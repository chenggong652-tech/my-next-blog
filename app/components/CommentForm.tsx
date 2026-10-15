"use client";

import { useActionState } from "react";
import { addComment } from "@/app/actions/comment";

// 评论输入框：登录才能发，发完页面自动刷新
export default function CommentForm({ blogId }: { blogId: string }) {
  // useActionState：提交时自动调用 addComment（你学过的套路）
  const [state, action, pending] = useActionState(
    async (prev: { success: boolean; msg: string }, formData: FormData) =>
      addComment(blogId, formData),
    { success: false, msg: "" }
  );

  return (
    <form action={action} style={{ marginTop: "16px" }}>
      <textarea
        name="content"
        placeholder="写下你的评论……（登录后可见）"
        rows={3}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid var(--card-border)",
          background: "var(--card-bg)",
          color: "var(--text)",
          fontSize: "14px",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
      <button
        type="submit"
        disabled={pending}
        style={{
          marginTop: "10px",
          padding: "8px 20px",
          borderRadius: "8px",
          border: "none",
          background: "#2563eb",
          color: "#ffffff",
          cursor: "pointer",
        }}
      >
        {pending ? "提交中..." : "发表评论"}
      </button>
      {state.msg && (
        <p style={{ marginTop: 8, fontSize: "14px", color: state.success ? "var(--link)" : "#dc2626" }}>
          {state.msg}
        </p>
      )}
    </form>
  );
}
