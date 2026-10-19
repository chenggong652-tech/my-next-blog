// app/admin/dashboard/page.tsx
// 第 33 课：商业数据看板（管理员专用）
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAdmin())) {
    return (
      <main style={{ maxWidth: 800, margin: "40px auto", textAlign: "center" }}>
        <h1>🔒 无权访问</h1>
        <p style={{ color: "#666" }}>这里只有管理员能进哦</p>
        <Link href="/" style={{ color: "#6366f1" }}>← 回首页</Link>
      </main>
    );
  }

  // ===== 核心数据：一次查齐 =====
  const [userCount, paidOrderCount, revenue, orderCount, resourceCount, boughtUserRows, levelRows, paidOrders] =
    await Promise.all([
      prisma.user.count(),
      prisma.order.count({ where: { status: "paid" } }),
      prisma.order.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
      prisma.order.count(),
      prisma.resource.count(),
      prisma.purchase.groupBy({ by: ["userId"], _count: { _all: true } }),
      prisma.user.groupBy({ by: ["level"], _count: { _all: true } }),
      prisma.order.findMany({ where: { status: "paid" }, select: { paidAt: true, amount: true, method: true } }),
    ]);

  const revenueYuan = (revenue._sum.amount ?? 0) / 100;
  const paidUserCount = boughtUserRows.length;
  const conversion = userCount > 0 ? Math.round((paidUserCount / userCount) * 100) : 0;

  // 图表 1：近 7 天营收（每天多少钱）
  const days: { date: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), total: 0 });
  }
  paidOrders.forEach((o) => {
    if (!o.paidAt) return;
    const key = o.paidAt.toISOString().slice(0, 10);
    const day = days.find((x) => x.date === key);
    if (day) day.total += o.amount;
  });
  const maxDay = Math.max(...days.map((d) => d.total), 1);

  // 图表 2：支付方式分布（各几单）
  const methodCount: Record<string, number> = {};
  paidOrders.forEach((o) => {
    methodCount[o.method] = (methodCount[o.method] || 0) + 1;
  });
  const methodList = [
    { key: "balance", label: "💳 余额", count: methodCount.balance || 0, color: "#6366f1" },
    { key: "wechat", label: "💚 微信", count: methodCount.wechat || 0, color: "#16a34a" },
    { key: "alipay", label: "💙 支付宝", count: methodCount.alipay || 0, color: "#1677ff" },
  ];
  const maxMethod = Math.max(...methodList.map((m) => m.count), 1);

  // 图表 3：会员等级分布（Lv1~5 各几人）
  const maxLevel = Math.max(...levelRows.map((r) => r._count._all), 1);

  const cards = [
    { icon: "👥", label: "注册用户", value: userCount, color: "#6366f1" },
    { icon: "🛒", label: "付费用户", value: paidUserCount, color: "#16a34a" },
    { icon: "💰", label: "总营收(¥)", value: revenueYuan.toFixed(2), color: "#f59e0b" },
    { icon: "🧾", label: "已支付订单", value: paidOrderCount, color: "#0ea5e9" },
    { icon: "📦", label: "资源总数", value: resourceCount, color: "#a855f7" },
    { icon: "📈", label: "付费转化率", value: conversion + "%", color: "#ef4444" },
  ];

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px 60px" }}>
      <h1 style={{ fontSize: 28, textAlign: "center", margin: "8px 0 4px" }}>📊 商业数据看板</h1>
      <p style={{ textAlign: "center", color: "#666", margin: "0 0 24px" }}>
        订单 / 收入 / 用户，一眼看懂网站赚了多少
        <Link href="/admin" style={{ display: "block", marginTop: 6, color: "#6366f1", fontSize: 14 }}>← 回后台</Link>
      </p>

      {/* 指标卡 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ border: "1px solid #eee", borderRadius: 14, padding: "16px 14px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 26 }}>{c.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, margin: "6px 0 2px", color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 13, color: "#888" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* 图表 1：近 7 天营收 */}
      <div style={{ border: "1px solid #eee", borderRadius: 14, padding: "20px 16px", marginTop: 20, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>💵 近 7 天营收</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180 }}>
          {days.map((d) => (
            <div key={d.date} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                {d.total > 0 ? `¥${(d.total / 100).toFixed(1)}` : ""}
              </div>
              <div style={{
                width: "100%", maxWidth: 44, margin: "0 auto",
                height: Math.round((d.total / maxDay) * 140),
                background: "linear-gradient(180deg, #f59e0b, #fde68a)",
                borderRadius: "6px 6px 0 0",
              }} />
              <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{d.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 图表 2 + 3 并排 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 20 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 14, padding: "20px 16px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>🧾 支付方式分布</h2>
          {methodList.map((m) => (
            <div key={m.key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 4 }}>
                <span>{m.label}</span><span>{m.count} 单</span>
              </div>
              <div style={{ height: 10, background: "#f0f0f0", borderRadius: 999 }}>
                <div style={{ height: 10, width: `${Math.round((m.count / maxMethod) * 100)}%`, background: m.color, borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 14, padding: "20px 16px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>⭐ 会员等级分布</h2>
          {[1, 2, 3, 4, 5].map((lv) => {
            const row = levelRows.find((r) => r.level === lv);
            const count = row?._count._all ?? 0;
            return (
              <div key={lv} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 4 }}>
                  <span>Lv.{lv}</span><span>{count} 人</span>
                </div>
                <div style={{ height: 10, background: "#f0f0f0", borderRadius: 999 }}>
                  <div style={{ height: 10, width: `${Math.round((count / maxLevel) * 100)}%`, background: lv >= 2 ? "#a855f7" : "#ddd", borderRadius: 999 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}