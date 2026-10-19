// app/topup/page.tsx
// 第 31 课：钱包充值页（模拟充值，第 32 课换真支付）
"use client";
import { useState } from "react";
import Link from "next/link";

export default function TopupPage() {
  const [amount, setAmount] = useState(10); // 默认充 10 元
  const [balance, setBalance] = useState<number | null>(null); // null=还没查过
  const [msg, setMsg] = useState("");

  // 查余额：GET /api/topup
  async function loadBalance() {
    const r = await fetch("/api/topup");
    const d = await r.json();
    setBalance(d.balance ?? 0);
  }

  // 充值：POST /api/topup（元 → 分）
  async function topup() {
    setMsg("");
    const r = await fetch("/api/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount * 100 }),
    });
    const d = await r.json();
    if (!d.ok) return setMsg("❌ " + d.msg);
    setMsg("✅ " + d.msg);
    setBalance(d.balance);
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "40px 16px" }}>
      <h1 style={{ fontSize: 26 }}>💰 钱包充值</h1>
      <p style={{ color: "#666" }}>先充 10 元体验付费下载（第 32 课接真支付）</p>

      {/* 快捷金额按钮 */}
      <div style={{ display: "flex", gap: 8, margin: "20px 0" }}>
        {[5, 10, 20, 50].map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc",
              background: amount === v ? "#6366f1" : "#fff",
              color: amount === v ? "#fff" : "#333", cursor: "pointer",
            }}
          >
            ¥{v}
          </button>
        ))}
      </div>

      {/* 充值按钮 */}
      <button
        onClick={topup}
        style={{
          padding: "12px 0", width: "100%", border: "none", borderRadius: 10,
          background: "#6366f1", color: "#fff", fontSize: 16, cursor: "pointer",
        }}
      >
        充值 ¥{amount}
      </button>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #eee" }} />

      {/* 查余额 */}
      <button
        onClick={loadBalance}
        style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
      >
        查看我的余额
      </button>
      {balance !== null && (
        <p style={{ marginTop: 10, fontWeight: 700 }}>当前余额：¥{(balance / 100).toFixed(2)}</p>
      )}

      <p style={{ marginTop: 24, fontSize: 13, color: "#999" }}>
        <Link href="/resources">← 返回资源库</Link>
      </p>
    </main>
  );
}
