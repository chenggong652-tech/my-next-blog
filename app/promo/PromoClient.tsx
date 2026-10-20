// app/promo/PromoClient.tsx
// C2 推广名片交互区：显示专属链接 + 一键复制
"use client";
import { useState } from "react";

export default function PromoClient({ refCode, siteUrl }: { refCode: string; siteUrl: string }) {
  const link = siteUrl + "/?ref=" + refCode;
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const box = document.getElementById("promo-link") as HTMLInputElement | null;
      box?.select();
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", borderRadius: 16, padding: "24px", color: "#fff", textAlign: "center" }}>
      <div style={{ fontSize: 14, opacity: 0.9 }}>我的专属推广链接</div>
      <input
        id="promo-link"
        readOnly
        value={link}
        onFocus={(e) => e.target.select()}
        style={{ width: "100%", marginTop: 10, padding: "10px 12px", borderRadius: 10, border: "none", fontSize: 14, color: "#333", outline: "none" }}
      />
      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 8 }}>
        推广码 {refCode} · 朋友 30 天内进来买东西都算你的
      </div>
      <button
        onClick={copyLink}
        style={{ marginTop: 12, padding: "10px 28px", borderRadius: 999, border: "none", background: "#fff", color: "#6366f1", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
      >
        {copied ? "✅ 已复制，去发！" : "📋 复制推广链接"}
      </button>
    </div>
  );
}
