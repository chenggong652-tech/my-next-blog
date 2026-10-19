// app/resources/page.tsx
// 第 30 课：资源上架系统 —— 前台资源区页面（商品展示墙）
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// 每次访问都实时查数据库（不缓存旧数据）
export const dynamic = "force-dynamic";

// 分类筛选按钮列表
const CATEGORIES = ["全部", "AI 教程", "提示词", "工具", "模板"];

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  // 读取地址栏里的分类参数，比如 /resources?cat=提示词
  const { cat } = await searchParams;
  const current = cat || "全部";

  // 从数据库拿"已上架"的资源，按分类过滤 + 排序
  const resources = await prisma.resource.findMany({
    where: {
      status: "published",
      ...(current !== "全部" ? { category: current } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px 60px" }}>
      <h1 style={{ textAlign: "center", fontSize: 32, margin: "8px 0 4px" }}>🎁 AI 资源库</h1>
      <p style={{ textAlign: "center", color: "#666", margin: "0 0 24px" }}>
        教程 / 提示词 / 工具 / 模板，全部拿来即用
      </p>

      {/* 分类筛选按钮 */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={c === "全部" ? "/resources" : `/resources?cat=${encodeURIComponent(c)}`}
            style={{
              padding: "8px 20px",
              borderRadius: 999,
              textDecoration: "none",
              fontSize: 15,
              border: "1px solid #ddd",
              background: c === current ? "#6366f1" : "#fff",
              color: c === current ? "#fff" : "#333",
            }}
          >
            {c}
          </Link>
        ))}
      </div>

      {/* 资源卡片网格 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {resources.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 14,
              overflow: "hidden",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {/* 封面区：有封面显示封面，没有就用标题第一个字当占位 */}
            <div
              style={{
                height: 140,
                background: "linear-gradient(135deg,#6366f1,#a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                color: "#fff",
              }}
            >
              {r.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.cover} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                r.title[0]
              )}
            </div>

            <div style={{ padding: 14 }}>
              {/* 分类徽章 + 价格 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, background: "#f0f0ff", color: "#6366f1", padding: "2px 8px", borderRadius: 999 }}>
                  {r.category}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: r.price === 0 ? "#16a34a" : "#f59e0b" }}>
                  {r.price === 0 ? "免费" : `¥${(r.price / 100).toFixed(1)}`}
                </span>
              </div>
              <h3 style={{ margin: "10px 0 6px", fontSize: 17 }}>{r.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#666", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {r.description}
              </p>
            </div>
          </div>
        ))}

        {resources.length === 0 && (
          <p style={{ textAlign: "center", color: "#999", gridColumn: "1 / -1", padding: 40 }}>
            这个分类还没有资源，稍后再来看看～
          </p>
        )}
      </div>
    </main>
  );
}
