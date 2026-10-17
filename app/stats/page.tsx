import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";

// 全站访问统计：每天多少人打开网站（管理员才能看）
export default async function StatsPage() {
  if (!(await isAdmin())) {
    return <main style={{ padding: "40px", textAlign: "center" }}>你没有权限查看统计</main>;
  }

  // 按日期分组：每天有多少条访问记录（最近30天，新的在前）
  const visits = await prisma.visit.groupBy({
    by: ["date"],
    _count: { _all: true },
    orderBy: { date: "desc" },
    take: 30,
  });
  const total = await prisma.visit.count();
  
    // 近7天数据（数组第 0 个是最新一天）
    const week = visits.slice(0, 7);
    // 找出这7天里的最大次数（柱子高度的"尺子"：最高柱子=100%）
    const maxVisits = week.length > 0 ? Math.max(...week.map((v) => v._count._all)) : 1;
  

  return (
    <main style={{ maxWidth: "700px", margin: "0 auto", padding: "24px" }}>
      <h1>📊 全站访问统计</h1>
      <p style={{ color: "var(--text-light)" }}>累计访问 {total} 次 · 最近 30 天</p>
      {/* 📊 近7天访问量柱状图 */}
      {week.length > 0 && (
        <div
          style={{
            border: "1px solid var(--card-border)",
            borderRadius: 12,
            padding: "20px 16px",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0 }}>📊 近 7 天访问量</h2>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              height: 180,
              marginTop: 16,
            }}
          >
            {week.map((v) => (
              <div key={v.date} style={{ flex: 1, textAlign: "center" }}>
                {/* 次数数字 */}
                <div style={{ fontSize: 12, color: "var(--text-light)", marginBottom: 4 }}>
                  {v._count._all}
                </div>
                {/* 柱子：高度 = 次数 ÷ 最大次数 × 140 像素（用像素最稳定，百分比依赖父容器高度会塌） */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: 44,
                    margin: "0 auto",
                    height: Math.round((v._count._all / maxVisits) * 140),
                    background: "linear-gradient(180deg, #f59e0b, #fde68a)",
                    borderRadius: "6px 6px 0 0",
                  }}
                />
                {/* 日期（只显示 月-日） */}
                <div style={{ fontSize: 12, color: "var(--text-light)", marginTop: 8 }}>
                  {v.date.slice(5)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {visits.length === 0 ? (
        <p style={{ color: "var(--text-light)" }}>还没有访问数据，去首页逛一圈吧</p>
      ) : (
        <div>
          {visits.map((v) => (
            <div
              key={v.date}
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--card-border)",
                padding: "10px 0",
              }}
            >
              <span>{v.date}</span>
              <span style={{ fontWeight: 600 }}>{v._count._all} 次</span>
            </div>
          ))}
        </div>
      )}
      <p style={{ marginTop: 24 }}>
        <Link href="/admin" style={{ color: "var(--link)" }}>← 回后台</Link>
      </p>
    </main>
  );
}
