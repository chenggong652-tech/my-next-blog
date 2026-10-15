"use client";

import { useState } from "react";

// 分享按钮：一键复制当前文章链接
export default function ShareBtn() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      // 把当前页面的地址复制到剪贴板（新知识：浏览器剪贴板 API）
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true); // 按钮变"已复制"
      setTimeout(() => setCopied(false), 2000); // 2秒后恢复"分享"
    } catch {
      alert("复制失败，请手动复制地址栏的链接");
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        marginLeft: 16,
        padding: "6px 12px",
        borderRadius: "8px",
        border: "1px solid var(--card-border)",
        background: "var(--card-bg)",
        color: "var(--text)",
        cursor: "pointer",
      }}
    >
      {copied ? "✅ 已复制" : "🔗 分享"}
    </button>
  );
}
