// app/tags/page.tsx
// 标签云：所有标签 + 每篇文章数，点标签去筛选
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function TagsPage() {
  // 查所有标签 + 数每标签挂了多少文章（_count 聚合）
  // 新知识：orderBy 按"关联文章数"排序 → 热门标签排前面
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { blogs: true } } },
    orderBy: { blogs: { _count: "desc" } },
  });

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <h1>🏷️ 标签云</h1>
      <p style={{ color: "var(--text-light)", marginTop: 8 }}>共 {tags.length} 个标签，点击筛选文章</p>

      {tags.length === 0 ? (
        <p style={{ color: "var(--text-light)", marginTop: 20 }}>还没有标签，去写文章时给文章打上标签吧</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "20px" }}>
          {tags.map((t) => (
            <Link
              key={t.id}
              href={`/blog?tag=${encodeURIComponent(t.name)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "999px",
                border: "1px solid var(--card-border)",
                background: "var(--card-bg)",
                textDecoration: "none",
                color: "var(--link)",
                fontSize: "15px",
              }}
            >
              #{t.name}
              {/* 文章数徽章 */}
              <span
                style={{
                  background: "#eef2ff",
                  color: "#4338ca",
                  borderRadius: "999px",
                  padding: "0 8px",
                  fontSize: "12px",
                  lineHeight: "20px",
                }}
              >
                {t._count.blogs}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
