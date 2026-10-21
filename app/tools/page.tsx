// app/tools/page.tsx
// 🅵1 AI 工具导航页：像逛超市一样看 AI 工具——分类筛选 + 搜索 + 卡片直达
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "🧰 AI 工具导航 | AizyBase",
  description:
    "精选好用 AI 工具：AI 对话、AI 绘画、AI 音乐、AI 办公，分类导航，点一下直达官网。",
};

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; q?: string }>;
}) {
  const { c, q } = await searchParams;
  const cat = c || "all"; // 当前选的分类（默认全部）
  const kw = (q || "").trim(); // 搜索关键词

  // 从货架拿工具：选了什么分类就只拿那类；有搜索词就只拿名字/简介里带词的
  const tools = await prisma.tool.findMany({
    where: {
      ...(cat !== "all" ? { category: cat } : {}),
      ...(kw
        ? {
            OR: [{ name: { contains: kw } }, { description: { contains: kw } }],
          }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }], // 推荐位最前，再按排序号
  });

  // 分类货架清单：统计每个分类各有多少工具（标签按数量排，多的在前）
  const cats = await prisma.tool.groupBy({
    by: ["category"],
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
  });

  // 图标颜色池：没配图标时按名字取一个字上色，五颜六色好看
  const colors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6"];

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 20px 60px" }}>
      {/* 卡片悬停动画（纯 CSS，服务端也能用） */}
      <style>{`
        .tool-card {
          transition: transform .12s ease, box-shadow .12s ease;
        }
        .tool-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,.14);
        }
      `}</style>

      {/* 门头 */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: 34, margin: "0 0 6px" }}>🧰 AI 工具导航</h1>
        <p style={{ color: "var(--text-light)", fontSize: 14 }}>
          精选好用 AI 工具，分门别类摆好——点一下直达官网
        </p>
      </div>

      {/* 搜索框：按名字/简介搜 */}
      <form
        method="get"
        style={{ maxWidth: "480px", margin: "0 auto 20px", display: "flex", gap: "8px" }}
      >
        <input
          type="text"
          name="q"
          defaultValue={kw}
          placeholder="🔍 搜工具：如 绘画、ChatGPT…"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--card-border)",
            background: "var(--card-bg)",
            color: "var(--text)",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          搜索
        </button>
      </form>

      {/* 分类标签：点哪个看哪类 */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "24px" }}>
        <Link
          href="/tools"
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
            href={`/tools?c=${encodeURIComponent(t.category)}`}
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
      {tools.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-light)", fontSize: 14, padding: "40px 0" }}>
          这个分类还没有工具，稍后再来看看～
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
          {tools.map((t, i) => {
            const color = colors[(t.name.length + i) % colors.length]; // 每张卡片一个图标底色
            return (
              <a
                key={t.id}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tool-card"
                style={{
                  textDecoration: "none",
                  border: "1px solid var(--card-border)",
                  borderRadius: 14,
                  padding: "18px",
                  background: "var(--card-bg)",
                  display: "block",
                  position: "relative",
                }}
              >
                {/* 推荐角标 */}
                {t.featured && (
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

                {/* 图标：配了就用配的（emoji/图片），没配就用名字首字 + 彩底 */}
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    background: t.icon ? "transparent" : color,
                    color: "#fff",
                    marginBottom: 12,
                  }}
                >
                  {t.icon ? t.icon : t.name.slice(0, 1)}
                </div>

                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                  {t.name}
                </p>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: "var(--text-light)",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {t.description}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 10px",
                      borderRadius: 999,
                      background: color + "22",
                      color: color,
                    }}
                  >
                    {t.category}
                  </span>
                  <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 600 }}>🚀 去使用 →</span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      <p style={{ textAlign: "center", color: "var(--text-light)", fontSize: 12, marginTop: 28 }}>
        觉得哪个工具好用？去后台可以随时上架新工具 📌
      </p>
    </main>
  );
}
