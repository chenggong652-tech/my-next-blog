// app/hot/page.tsx —— 热门文章榜：全站最火的文章按阅读量排名
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RelativeTime from "@/app/components/RelativeTime";

export default async function HotPage() {
  // 全部已发布文章，按阅读量从高到低排
  const blogs = await prisma.blog.findMany({
    where: { status: "published" },
    orderBy: { views: "desc" },
    include: { user: true },
  });

  // 前三名的奖牌
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: "32px" }}>🔥 热门文章榜</h1>
      <p style={{ color: "var(--text-light)", marginTop: 8 }}>
        全站 {blogs.length} 篇文章，按阅读量排名
      </p>

      {blogs.length === 0 ? (
        <p style={{ color: "var(--text-light)" }}>还没有文章</p>
      ) : (
        <div style={{ marginTop: "24px" }}>
          {blogs.map((blog, index) => (
            <Link href={`/blog/${blog.id}`} key={blog.id} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  border: "1px solid var(--card-border)",
                  padding: "16px 20px",
                  marginBottom: "12px",
                  borderRadius: "12px",
                  background: index < 3 ? "#fffbeb" : "var(--card-bg)", // 前三名浅金色底
                }}
              >
                {/* 排名 */}
                <div style={{ fontSize: "28px", width: "48px", textAlign: "center", flexShrink: 0 }}>
                  {index < 3 ? medals[index] : (
                    <span style={{ fontSize: "20px", color: "var(--text-light)", fontWeight: 700 }}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* 文章信息 */}
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: "18px", color: index < 3 ? "#78350f" : "var(--text)" }}>
                    {blog.title}
                  </h2>
                  <p style={{ margin: "6px 0 0", fontSize: "13px", color: index < 3 ? "#92400e" : "var(--text-light)" }}>
                    {blog.category} · {blog.user?.name || "匿名"} · <RelativeTime time={blog.createdAt} />
                  </p>
                </div>

                {/* 阅读量 */}
                <div style={{ marginLeft: "auto", textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#d97706" }}>{blog.views}</div>
                  <div style={{ fontSize: "12px", color: index < 3 ? "#92400e" : "var(--text-light)" }}>阅读量</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
