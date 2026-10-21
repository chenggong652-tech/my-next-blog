// app/prompts/page.tsx
// 🅵2 提示词模板库页：分类筛选 + 卡片 + 复制按钮
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CopyButton from "./CopyButton";

export const metadata = {
  title: "📋 提示词模板库 | AizyBase",
  description: "精选常用 AI 提示词模板：写作、绘画、小红书、办公，复制即用。",
};

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const cat = c || "all"; // 当前分类（默认全部）

  // 货架拿货：选分类就只拿那类；推荐位最前，再按排序号
  const prompts = await prisma.prompt.findMany({
    where: cat !== "all" ? { category: cat } : {},
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  // 分类清单（按数量排，多的在前）
  const cats = await prisma.prompt.groupBy({
    by: ["category"],
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
  });

  return (
    <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "28px 20px 60px" }}>
      {/* 卡片悬停动画（纯 CSS） */}
      <style>{`
        .prompt-card { transition: transform .12s ease, box-shadow .12s ease; }
        .prompt-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.14); }
      `}</style>

      {/* 门头 */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: 34, margin: "0 0 6px" }}>📋 提示词模板库</h1>
        <p style={{ color: "var(--text-light)", fontSize: 14 }}>
          精选常用 AI 提示词，点一下复制，拿去就能用
        </p>
      </div>

      {/* 分类标签 */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "24px" }}>
        <Link
          href="/prompts"
          style={{
            padding: "7px 16px",
            borderRadius: 999,
            textDecoration: "none",
            fontSize: 13,
            border: "1px solid var(--card-border)",
            background: cat === "all" ? "#2563eb" : "var(--card-bg)",
            color: cat === "all" ? "#fff" : "var(--text-light)",
          }}
        >
          📂 全部
        </Link>
        {cats.map((t) => (
          <Link
            key={t.category}
            href={`/prompts?c=${encodeURIComponent(t.category)}`}
            style={{
              padding: "7px 16px",
              borderRadius: 999,
              textDecoration: "none",
              fontSize: 13,
              border: "1px solid var(--card-border)",
              background: cat === t.category ? "#2563eb" : "var(--card-bg)",
              color: cat === t.category ? "#fff" : "var(--text-light)",
            }}
          >
            {t.category}（{t._count.category}）
          </Link>
        ))}
      </div>

      {/* 货架：卡片网格 */}
      {prompts.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-light)", fontSize: 14, padding: "40px 0" }}>
          这个分类还没有提示词，稍后再来看看～
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
          {prompts.map((p) => (
            <div
              key={p.id}
              className="prompt-card"
              style={{
                border: "1px solid var(--card-border)",
                borderRadius: 14,
                padding: "18px",
                background: "var(--card-bg)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                minHeight: 170,
              }}
            >
              {p.featured && (
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#fef08a",
                    color: "#854d0e",
                  }}
                >
                  ⭐ 推荐
                </span>
              )}

              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                {p.title}
              </p>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 13,
                  color: "var(--text-light)",
                  lineHeight: 1.5,
                  flex: 1,
                }}
              >
                {p.prompt.length > 55 ? p.prompt.slice(0, 55) + "…" : p.prompt}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 999, background: "#f3f4f6", color: "#6b7280" }}>
                  {p.category}
                </span>
                <span style={{ fontSize: 12, color: "#b45309" }}>🔥 用了 {p.useCount} 次</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <CopyButton id={p.id} prompt={p.prompt} />
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ textAlign: "center", color: "var(--text-light)", fontSize: 12, marginTop: 28 }}>
        觉得哪个提示词好用？去后台可以随时上架新模板 📌
      </p>
    </main>
  );
}
