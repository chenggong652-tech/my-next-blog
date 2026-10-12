// app/blog/[id]/page.tsx
// 动态路由：/blog/任意文章id 都会进入这个页面
import BlogDeleteBtn from "@/app/components/BlogDeleteBtn";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";

// 根据文章内容，动态生成网页标题
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const blog = await prisma.blog.findUnique({ where: { id } });

  if (!blog) {
    return { title: "文章不存在" };
  }
  return {
    title: blog.title,
    description: `阅读文章：${blog.title}`,
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 获取登录状态
  const session = await auth();

  // 读取文章（顺便查出作者信息）
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: { user: true },
  });

  // 如果文章不存在，显示提示页
  if (!blog) {
    return (
      <main style={{ maxWidth: "800px", margin: "40px auto" }}>
        <h1>文章不存在</h1>
        <Link href="/blog">← 返回博客列表</Link>
      </main>
    );
  }

  // 阅读量 +1（每次有人打开这篇文章，就加1）
  // 简单实现：刷新一次就加一次，真实网站会用cookie防止重复计数
  await prisma.blog.update({
    where: { id },
    data: { views: { increment: 1 } },
  });

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <Link href="/blog" style={{ fontSize: 14, color: "#666" }}>
          ← 返回博客列表
        </Link>

        <h1 style={{ margin: "16px 0 8px", fontSize: "32px" }}>{blog.title}</h1>

        {/* 作者 + 发布时间 + 阅读量 */}
        <p style={{ color: "#666", fontSize: "14px" }}>
          <Link href={`/profile/${blog.userId}`} style={{ color: "#2563eb" }}>
            {blog.user?.name || "匿名"}
          </Link>
          发布于 {blog.createdAt.toLocaleString()}
          <span style={{ marginLeft: 16 }}>📖 阅读量：{blog.views}</span>
        </p>

        {/* 文章正文 */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid #e5e7eb",
            lineHeight: "1.8",
            whiteSpace: "pre-wrap",
          }}
        >
          {blog.content}
        </div>

        {/* 只有文章的作者本人，才显示编辑、删除按钮 */}
        {session?.user?.id === blog.userId && (
          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <Link href={`/blog/${blog.id}/edit`}>
              <button
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                编辑文章
              </button>
            </Link>
            <BlogDeleteBtn blogId={blog.id} />
          </div>
        )}
      </div>
    </main>
  );
}
