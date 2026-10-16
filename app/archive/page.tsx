// app/archive/page.tsx
// 文章归档：按月份分组列出所有文章
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ArchivePage() {
  // 查所有文章（只取标题和发布时间，轻量）
  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  // 新知识：reduce 分组——按"年-月"把文章放进对应抽屉
  const groups = blogs.reduce<Record<string, typeof blogs>>((acc, b) => {
    const month = `${b.createdAt.getFullYear()}年${b.createdAt.getMonth() + 1}月`;
    (acc[month] ||= []).push(b); // 有这月份就放进去，没有就新建
    return acc;
  }, {});

  const months = Object.keys(groups); // 所有月份（新知识：取抽屉钥匙）

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <h1>🗂️ 文章归档</h1>
      <p style={{ color: "var(--text-light)", marginTop: 8 }}>共 {blogs.length} 篇文章，按月份整理</p>

      {months.length === 0 ? (
        <p style={{ color: "var(--text-light)", marginTop: 20 }}>还没有文章</p>
      ) : (
        months.map((month) => (
          <div key={month} style={{ marginTop: "28px" }}>
            {/* 月份标题 + 这月几篇 */}
            <h2 style={{ fontSize: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: 8 }}>
              {month}
              <span style={{ fontSize: 13, color: "var(--text-light)", marginLeft: 8 }}>
                {groups[month].length} 篇
              </span>
            </h2>
            <div style={{ marginTop: 12 }}>
              {groups[month].map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 4px",
                    borderBottom: "1px dashed var(--card-border)",
                  }}
                >
                  <Link href={`/blog/${b.id}`} style={{ color: "var(--link)", textDecoration: "none" }}>
                    {b.title}
                  </Link>
                  <span style={{ fontSize: 13, color: "var(--text-light)" }}>
                    {b.createdAt.getMonth() + 1}月{b.createdAt.getDate()}日
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </main>
  );
}
