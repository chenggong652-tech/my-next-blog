// app/blog/[id]/page.tsx
// 动态路由：/blog/任意文章id 都会进入这个页面
// Next.js 15 之后，params 变成了异步的，必须 await 才能拿到 id
import { deleteBlog } from "../actions";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";
import Link from "next/link";
import type { Metadata } from "next";

// 根据文章内容，动态生成网页标题（必须写在组件函数外面）
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
  // await params 之后才能拿到网址里面的文章id
  const { id } = await params;

  // 获取登录状态（没登录时 session 是 null）
  const session = await auth();

  // 从我们自己的数据库读取这篇文章
  const blog = await prisma.blog.findUnique({
    where: { id },
  });

  // 如果文章不存在，显示提示页，而不是报错
  if (!blog) {
    return (
      <main style={{ maxWidth: "800px", margin: "40px auto" }}>
        <h1>文章不存在</h1>
        <Link href="/blog">← 返回博客列表</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
      <Link href="/blog">← 返回博客列表</Link>
      <h1>{blog.title}</h1>
      <p style={{ color: "#666", fontSize: "14px" }}>{blog.createdAt.toLocaleString()}</p>
      <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.8" }}>{blog.content}</p>
      {/* 只有登录了，才显示编辑、删除按钮 */}
      {session && (
        <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
          <Link href={`/blog/${blog.id}/edit`}>
            <button style={{ padding: "6px 12px" }}>编辑文章</button>
          </Link>
          <Link href="/blog/search">
            <button style={{ padding: "6px 12px" }}>🔍 搜索文章</button>
          </Link>
          <form action={deleteBlog}>
            <input type="hidden" name="id" value={blog.id} />
            <button type="submit" style={{ padding: "6px 12px", color: "red" }}>删除文章</button>
          </form>
        </div>
      )}
    </main>
  );
}
