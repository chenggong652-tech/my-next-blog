// app/resources/ResourceCard.tsx
// 第 31-32 课：资源卡片（购买前先选支付方式：余额 / 模拟微信 / 模拟支付宝）
// 🅲1 升级：卡片显示限时折扣（活动价 + 原价划线 + 限时标签）
"use client";
import { useState } from "react";
import { effectivePrice, isOnSale } from "@/lib/vip"; // 🅲1 共用最终价计算器（和支付同一个算法）

export default function ResourceCard({
  r,
  owned,
  balance,
  level = 1,
}: {
  r: any;
  owned: boolean;
  balance: number;
  level?: number;
}) {
  // status：idle=没买 / buying=正在买 / done=已买可下载
  const [status, setStatus] = useState<"idle" | "buying" | "done">(owned ? "done" : "idle");
  const [msg, setMsg] = useState("");
  const [payOpen, setPayOpen] = useState(false); // 大白话：是否展开了"选择支付方式"面板

  // 🅲1：最终价（活动价→叠会员折扣）+ 是否在打折
  const finalPrice = effectivePrice(r, level);
  const onSale = isOnSale(r);

  function download() {
    if (!r.downloadUrl) return setMsg("这个资源还没有下载链接，联系站长补上～");
    window.open(r.downloadUrl, "_blank");
  }

  // 大白话：选好支付方式后统一走这里。
  // method 三种：balance=余额秒付 / wechat=模拟微信 / alipay=模拟支付宝
  async function buy(method: "balance" | "wechat" | "alipay") {
    setMsg("");
    setStatus("buying");
    const res = await fetch("/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId: r.id, method }),
    });
    const d = await res.json();
    if (!d.ok) {
      setStatus("idle");
      if (d.msg.includes("余额不足")) setMsg(d.msg + "（点这里去充值）");
      else setMsg("❌ " + d.msg);
      return;
    }
    if (d.orderId) {
      // 微信/支付宝：下单成功 → 拿着订单号跳去"收银台"
      window.location.href = `/pay/${d.orderId}`;
      return;
    }
    // 余额支付：秒到 → 按钮直接变"下载"
    setStatus("done");
    setMsg("✅ 购买成功，可下载啦！");
  }

  const isFree = r.price === 0;
  const canDownload = isFree || status === "done";  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden",
      background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" }}>
      {/* 封面区 */}
      <div style={{ height: 140, background: "linear-gradient(135deg,#6366f1,#a855f7)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "#fff", position: "relative" }}>
        {r.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.cover} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          r.title[0]
        )}
        {/* 🅲1 限时折扣角标 */}
        {onSale && (
          <span style={{ position: "absolute", top: 10, left: 10, background: "#dc2626", color: "#fff",
            fontSize: 12, padding: "3px 10px", borderRadius: 999, fontWeight: 700 }}>
            ⏰ 限时
          </span>
        )}
      </div>

      <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, background: "#f0f0ff", color: "#6366f1", padding: "2px 8px", borderRadius: 999 }}>
            {r.category}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: r.price === 0 ? "#16a34a" : (onSale ? "#dc2626" : "#f59e0b") }}>
            {r.price === 0 ? "免费" : `¥${(finalPrice / 100).toFixed(1)}`}
            {onSale && (
              <span style={{ fontSize: 12, color: "#999", textDecoration: "line-through", fontWeight: 400, marginLeft: 6 }}>
                ¥{(r.price / 100).toFixed(1)}
              </span>
            )}
          </span>
        </div>

        <h3 style={{ margin: "10px 0 6px", fontSize: 17 }}>{r.title}</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#666", lineHeight: 1.5, flex: 1 }}>{r.description}</p>

        <div style={{ marginTop: 10 }}>
          {canDownload ? (
            <button onClick={download} style={{ width: "100%", padding: "10px 0", border: "none", borderRadius: 8,
              background: isFree ? "#16a34a" : "#6366f1", color: "#fff", fontSize: 15, cursor: "pointer" }}>
              {isFree ? "免费下载" : "📥 下载"}
            </button>
          ) : payOpen ? (
            // 展开的"选择支付方式"面板
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => buy("balance")} disabled={status === "buying"}
                style={{ padding: "9px 0", border: "none", borderRadius: 8, background: "#6366f1",
                  color: "#fff", fontSize: 14, cursor: "pointer" }}>
                余额支付 ¥{(finalPrice / 100).toFixed(1)}（余额 ¥{(balance / 100).toFixed(2)}）
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => buy("wechat")} disabled={status === "buying"}
                  style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 8, background: "#16a34a",
                    color: "#fff", fontSize: 14, cursor: "pointer" }}>
                  微信支付
                </button>
                <button onClick={() => buy("alipay")} disabled={status === "buying"}
                  style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 8, background: "#1677ff",
                    color: "#fff", fontSize: 14, cursor: "pointer" }}>
                  支付宝
                </button>
              </div>
              <button onClick={() => setPayOpen(false)} style={{ fontSize: 12, color: "#999", background: "none", border: "none", cursor: "pointer" }}>
                ← 取消
              </button>
            </div>
          ) : (
            <button onClick={() => setPayOpen(true)} disabled={status === "buying"}
              style={{ width: "100%", padding: "10px 0", border: "none", borderRadius: 8,
                background: "#f59e0b", color: "#fff", fontSize: 15, cursor: "pointer" }}>
              {status === "buying" ? "购买中..." : `¥${(finalPrice / 100).toFixed(1)} 购买`}
            </button>
          )}
          {msg && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#666" }}>
              {msg.includes("去充值") ? (
                <a href="/topup" style={{ color: "#f59e0b" }}>{msg}</a>
              ) : (
                msg
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
