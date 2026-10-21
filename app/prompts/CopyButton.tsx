// app/prompts/CopyButton.tsx
// 🅵2 复制按钮（客户端组件）：点击→复制到剪贴板→变"✅ 已复制"
"use client";
import { useState } from "react";
import { incrementPromptUse } from "./actions";

export default function CopyButton({ id, prompt }: { id: string; prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt); // 新式复制：写入剪贴板
    } catch {
      // 旧式兜底：临时文本框选中复制（某些浏览器/权限限制时也能用）
      const ta = document.createElement("textarea");
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true); // 按钮变成"✅ 已复制"
    setTimeout(() => setCopied(false), 1500); // 1.5 秒后变回"📋 复制"
    incrementPromptUse(id); // 悄悄加一次使用次数
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: "6px 14px",
        borderRadius: 8,
        border: "none",
        background: copied ? "#16a34a" : "#2563eb",
        color: "#fff",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {copied ? "✅ 已复制！" : "📋 复制"}
    </button>
  );
}
