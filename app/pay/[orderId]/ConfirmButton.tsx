// app/pay/[orderId]/ConfirmButton.tsx
// 第 32 课：确认支付按钮（点它 = 模拟在微信里输密码付款）
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmButton({ orderId }: { orderId: string }) {
  const router = useRouter(); // 大白话：路由跳转工具（"带我去某页"）
  const [msg, setMsg] = useState("");

  async function pay() {
    setMsg("");
    // 调回调接口："支付平台"通知网站钱到了 → 网站发货
    const res = await fetch("/api/pay/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const d = await res.json();
    if (!d.ok) return setMsg("❌ " + d.msg);
    // 付成功了 → 跳去"我的下载"，看刚买的资源
    router.push("/resources/mine");
  }

  return (
    <div>
      <button
        onClick={pay}
        style={{
          width: "100%", padding: "14px 0", marginTop: 16, border: "none", borderRadius: 10,
          background: "#16a34a", color: "#fff", fontSize: 17, cursor: "pointer",
        }}
      >
        确认支付
      </button>
      {msg && <p style={{ marginTop: 10, color: "#dc2626", textAlign: "center" }}>{msg}</p>}
    </div>
  );
}
