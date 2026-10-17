"use client";
import { useState } from "react";
import { addCommentReply } from "@/app/actions/comment";

// 某条评论下面的"回复输入框"
export default function CommentReplyBox({ blogId, commentId }: { blogId: string; commentId: string }) {
  const [open, setOpen] = useState(false);   // 输入框开没开
  const [content, setContent] = useState(""); // 输入框里的字
  const [errMsg, setErrMsg] = useState("");   // 错误提示
  const [sending, setSending] = useState(false); // 正在发送吗

  async function handleSubmit() {
    setErrMsg("");
    if (!content.trim()) {
      setErrMsg("回复内容不能为空");
      return;
    }
    setSending(true);
    const fd = new FormData();
    fd.set("commentId", commentId);
    fd.set("content", content);
    const res = await addCommentReply(blogId, fd);
    setSending(false);
    if (!res?.success) {
      setErrMsg(res?.msg || "回复失败");
      return;
    }
    setContent("");
    setOpen(false);
    window.location.reload(); // 刷新页面，让最新回复显示出来
  }

  return (
    <div>
      {/* "回复"小按钮：点一下展开输入框，再点收起 */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          fontSize: "12px",
          color: "var(--link)",
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
      >
        {open ? "取消" : "💬 回复"}
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的回复……"
            style={{
              width: "100%",
              height: 60,
              padding: 8,
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
            }}
          />
          {errMsg && <p style={{ color: "red", fontSize: 12, margin: "4px 0" }}>{errMsg}</p>}
          <button
            onClick={handleSubmit}
            disabled={sending}
            style={{
              marginTop: 6,
              padding: "6px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {sending ? "发送中..." : "提交回复"}
          </button>
        </div>
      )}
    </div>
  );
}
