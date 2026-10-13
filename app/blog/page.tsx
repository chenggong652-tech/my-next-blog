import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "博客列表",
  description: "查看全部博客文章",
};

// 每页展示多少篇
const PAGE_SIZE = 3;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  // 获取当前页码，默认第1页
  const currentPage = Number(params.page) || 1;
  const currentCategory = params.category || "全部";
  const skip = (currentPage - 1) * PAGE_SIZE;

  // 查询当前页文章
  const blogList = await prisma.blog.findMany({
    where: currentCategory === "全部" ? {} : { category: currentCategory },
    orderBy: { createdAt: "desc" },
    include: { user: true },
    skip: skip,
    take: PAGE_SIZE,
  });

  // 查询总共有多少篇文章，用来算总页数
  const totalCount = await prisma.blog.count({
    where: currentCategory === "全部" ? {} : { category: currentCategory },
  });  
  const totalPage = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h1>博客文章列表</h1>
            {/* 分类筛选按钮：点哪个，就看哪类 */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["全部", "未分类", "学习笔记", "生活随笔", "技术教程"].map((cat) => (
          <Link
            key={cat}
            href={cat === "全部" ? "/blog" : `/blog?category=${encodeURIComponent(cat)}`}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              border: "1px solid #e5e7eb",
              background: currentCategory === cat ? "#2563eb" : "#ffffff",
              color: currentCategory === cat ? "#ffffff" : "#333",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            {cat}
          </Link>
        ))}
      </div>

      {session && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <Link href="/blog/new">
            <button>✏️ 新建文章</button>
          </Link>
          <Link href="/blog/search">
            <button>🔍 搜索文章</button>
          </Link>
        </div>
      )}

      <div>
        {blogList.length === 0 ? (
          <p>暂时还没有文章，点击上方按钮新建第一篇！</p>
        ) : (
          blogList.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #e5e7eb",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "10px",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <Link href={`/blog/${item.id}`}>
                <h2 style={{ margin: 0, color: "#2563eb" }}>{item.title}</h2>
              </Link>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  background: "#eef2ff",
                  color: "#4338ca",
                  marginBottom: "8px",
                }}
              >
                {item.category}
              </span>
              <p style={{ color: "#666", fontSize: "14px" }}>
                <Link href={`/profile/${item.userId}`} style={{ color: "#2563eb" }}>
                  {item.user?.name || "匿名"}
                </Link>
                发布于 {item.createdAt.toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 分页按钮区域 */}
      {totalPage > 1 && (
        <div style={{ display: "flex", gap: "12px", marginTop: "30px", alignItems: "center" }}>
          {currentPage <= 1 ? (
            <button disabled style={{ opacity:0.4,cursor:"not-allowed" }}>上一页</button>
          ) : (
            <Link href={`/blog?category=${currentCategory}&page=${currentPage - 1}`}>
              <button>上一页</button>
            </Link>
          )}

          <span>
            {currentPage} / {totalPage}
          </span>

          {currentPage >= totalPage ? (
            <button disabled style={{ opacity:0.4,cursor:"not-allowed" }}>下一页</button>
          ) : (
            <Link href={`/blog?category=${currentCategory}&page=${currentPage + 1}`}>
              <button>下一页</button>
            </Link>
          )}
        </div>
      )}
    </main>
  );
}