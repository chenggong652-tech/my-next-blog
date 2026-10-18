// app/series/[name]/page.tsx
// 第 26 课：系列/专栏页 —— 一个系列的所有文章都在这里
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

type Props = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} 系列 | AizyBase` };
}

export default async function SeriesPage({ params }: Props) {
  const { name } = await params;
  const seriesName = decodeURIComponent(name);

  // 查这个系列的所有文章（按时间从新到旧）
  const blogs = await prisma.blog.findMany({
    where: { series: seriesName, status: "published" },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: "28px" }}>📚 {seriesName}</h1>
      <p style={{ color: "var(--text-light)" }}>
        系列共 {blogs.length} 篇 · 跟着这个系列学，不迷路
      </p>
      <div style={{ marginTop: "16px" }}>
        {blogs.map((b, i) => (
          <div
            key={b.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              border: "1px solid var(--card-border)",
              padding: "12px 16px",
              marginTop: "10px",
              borderRadius: "10px",
              background: "var(--card-bg)",
            }}
          >
            <span style={{ color: "var(--link)", fontWeight: 700, fontSize: "18px" }}>
              {i + 1}
            </span>
            <div style={{ minWidth: 0 }}>
              <Link href={`/blog/${b.id}`} style={{ color: "var(--link)", fontWeight: 600, textDecoration: "none" }}>
                {b.title}
              </Link>
              <p style={{ margin: "4px 0 0", color: "var(--text-light)", fontSize: "13px" }}>
                {b.user?.name || "匿名"} · 📖 {b.views} 阅读
              </p>
            </div>
          </div>
        ))}
        {blogs.length === 0 && (
          <p style={{ color: "var(--text-light)" }}>这个系列还没有文章</p>
        )}
      </div>
    </main>
  );
}
