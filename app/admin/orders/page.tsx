// app/admin/orders/page.tsx
// 🅲3 订单管理后台：看账本（谁买了啥、付没付、谁推广的）
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import OrderActions from "./OrderActions";

export const metadata = {
  title: "🧾 订单管理 | AizyBase",
  robots: { index: false, follow: false },
};

// 大白话：翻账本，支持按"付没付"筛选
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const admin = await isAdmin();
  if (!admin) {
    return (
      <main style={{ maxWidth: "800px", margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "28px" }}>🔒 无权访问</h1>
        <p style={{ color: "var(--text-light)" }}>这里只有管理员能进哦</p>
        <Link href="/" style={{ color: "var(--link)" }}>← 回首页</Link>
      </main>
    );
  }

  const { s } = await searchParams;
  const filter = s || "all"; // 没传筛选 = 看全部

  // 大白话：筛选开关——all=全部；否则只查那个状态（如 paid=只看已支付的）
  const where = filter === "all" ? {} : { status: filter };

  // 翻账本：最新订单在最上面，连带买家昵称/资源名/推广员
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      resource: { select: { title: true } },
      referrer: { select: { name: true } },
    },
  });

  // 状态徽章的样子（每种状态一种颜色，一眼分辨）
  const statusInfo: Record<string, { text: string; color: string; bg: string }> = {
    pending: { text: "⏳ 待支付", color: "#b45309", bg: "#fef9c3" },
    paid: { text: "✅ 已支付", color: "#166534", bg: "#dcfce7" },
    cancelled: { text: "🚫 已取消", color: "#6b7280", bg: "#f3f4f6" },
    refunded: { text: "↩️ 已退款", color: "#9d174d", bg: "#fce7f3" },
  };

  // 支付方式翻译
  const methodText: Record<string, string> = {
    balance: "💰 余额",
    wechat: "💚 微信",
    alipay: "🔵 支付宝",
  };

  const tabs = [
    { key: "all", label: "📋 全部" },
    { key: "pending", label: "⏳ 待支付" },
    { key: "paid", label: "✅ 已支付" },
    { key: "cancelled", label: "🚫 已取消" },
    { key: "refunded", label: "↩️ 已退款" },
  ];

  return (
    <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: "28px" }}>🧾 订单管理</h1>
      <p style={{ color: "var(--text-light)" }}>全站账本：谁买了啥、付没付、谁推广的</p>

      {/* 状态筛选按钮：点哪个看哪个 */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/admin/orders" : `/admin/orders?s=${t.key}`}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              textDecoration: "none",
              fontSize: "14px",
              border: "1px solid var(--card-border)",
              background: filter === t.key ? "#2563eb" : "var(--card-bg)",
              color: filter === t.key ? "#fff" : "var(--text-light)",
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* 订单列表：一张小票一行 */}
      <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
        {orders.map((o) => (
          <div
            key={o.id}
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: "12px",
              padding: "14px 18px",
              background: "var(--card-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                📦 {o.resource.title}
                <span
                  style={{
                    marginLeft: "10px",
                    padding: "2px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "normal",
                    color: statusInfo[o.status]?.color || "#333",
                    background: statusInfo[o.status]?.bg || "#f3f4f6",
                  }}
                >
                  {statusInfo[o.status]?.text || o.status}
                </span>
              </p>
              <p style={{ margin: "6px 0 0", color: "var(--text-light)", fontSize: "13px" }}>
                🧑 {o.user.name || o.user.email} ·{" "}
                {methodText[o.method] || o.method} · ¥{(o.amount / 100).toFixed(1)}
                {o.referrer && (
                  <span style={{ marginLeft: "8px", color: "#9333ea" }}>
                    🤝 推广员：{o.referrer.name}
                  </span>
                )}
                <span style={{ marginLeft: "8px" }}>· {o.createdAt.toLocaleString()}</span>
              </p>
            </div>

            {/* 🅲3 订单操作按钮：待支付的能补登收款；已支付的能退款 */}
            <OrderActions
              orderId={o.id}
              status={o.status}
              resourceTitle={o.resource.title}
              amount={o.amount}
            />
          </div>
        ))}
        {orders.length === 0 && (
          <p style={{ color: "var(--text-light)", fontSize: "14px", textAlign: "center", padding: "30px 0" }}>
            这个分类下还没有订单
          </p>
        )}
      </div>
    </main>
  );
}
