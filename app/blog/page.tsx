import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "博客列表",
  description: "查看全部博客文章",
};

export default async function BlogPage() {
  // 获取登录状态（没登录时 session 是 null）
  const session = await auth();

  // 从数据库读取全部文章，按时间倒序，最新的在最上面
  const blogList = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h1>博客文章列表</h1>
      {/* 只有登录了，才显示新建、搜索按钮 */}
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
                border: "1px solid #ccc",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "6px",
              }}
            >
              <Link href={`/blog/${item.id}`}>
                <h2 style={{ margin: 0, color: "#2563eb" }}>{item.title}</h2>
              </Link>
              <p style={{ color: "#666", fontSize: "14px" }}>
                {item.createdAt.toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
