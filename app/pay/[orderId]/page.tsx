// app/pay/[orderId]/page.tsx
// 第 32 课：模拟支付页（收银台：显示订单，点确认=模拟付款）
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import ConfirmButton from "./ConfirmButton";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  // 大白话：地址栏里的订单号，比如 /pay/cmvfc4wif0003...   →   params.orderId = cmvfc4wif0003...
  const { orderId } = await params;

  // 查这张订单（带资源信息，页面要显示"买的是啥"）
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { resource: true },
  });

  // 订单不存在 → 404 提示
  if (!order) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: 40, textAlign: "center" }}>
        <p>❌ 订单不存在</p>
        <Link href="/resources" style={{ color: "#6366f1" }}>返回资源库</Link>
      </main>
    );
  }

  // 已支付 → 直接显示"已完成"，不再给支付按钮（防重复付款）
  if (order.status === "paid") {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 24 }}>✅ 订单已支付</h1>
        <p style={{ color: "#666" }}>你已购买：{order.resource.title}</p>
        <Link href="/resources/mine" style={{ color: "#6366f1" }}>去我的下载 →</Link>
      </main>
    );
  }

  // 待支付 → 显示收银台
  const methodName = order.method === "wechat" ? "微信支付" : "支付宝";
  const paidBy = order.method === "wechat" ? "模拟微信" : "模拟支付宝";

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "40px 16px" }}>
      <h1 style={{ fontSize: 24, textAlign: "center" }}>🧾 收银台</h1>
      <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 20, background: "#fff", marginTop: 16 }}>
        <p style={{ margin: "0 0 6px", color: "#666", fontSize: 14 }}>商品：{order.resource.title}</p>
        <p style={{ margin: "0 0 6px", color: "#666", fontSize: 14 }}>
          支付方式：{methodName}（{paidBy}）
        </p>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#f59e0b" }}>
          ¥{(order.amount / 100).toFixed(2)}
        </p>
      </div>

      {/* 确认支付按钮（模拟付款动作） */}
      <ConfirmButton orderId={order.id} />

      <p style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "#999" }}>
        这是模拟支付（第 32 课教学用）。真实上线后这里会是微信/支付宝扫码界面。
        <br />
        <Link href="/resources" style={{ color: "#6366f1" }}>← 返回资源库</Link>
      </p>
    </main>
  );
}
