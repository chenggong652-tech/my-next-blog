// app/blog/[id]/page.tsx
// 动态路由：/blog/任意文章id 都会进入这个页面
import BlogDeleteBtn from "@/app/components/BlogDeleteBtn";
import ViewCounter from "@/app/components/ViewCounter";
import FavoriteBtn from "@/app/components/FavoriteBtn";
import BackToTop from "@/app/components/BackToTop";
import ReadingProgress from "@/app/components/ReadingProgress";
import ShareBtn from "@/app/components/ShareBtn";
import CommentForm from "@/app/components/CommentForm";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
import HistoryTracker from "@/app/components/HistoryTracker";
import RelativeTime from "@/app/components/RelativeTime";
import ReactMarkdown from "react-markdown";

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
    // 社交分享卡片：发微信/朋友圈时，对方看到的小卡片内容
    openGraph: {
      title: blog.title,
      description: `阅读文章：${blog.title}`,
      type: "article",
      images: blog.coverImage ? [{ url: blog.coverImage }] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 获取登录状态
  const session = await auth();

  // 读取文章（顺便查出作者信息）
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: { user: true, tags: { include: { tag: true } } },
  });

  // 如果文章不存在，显示提示页（先判空！后面才能安全使用 blog）
  if (!blog) {
    return (
      <main style={{ maxWidth: "800px", margin: "40px auto" }}>
        <h1>文章不存在</h1>
        <Link href="/blog">← 返回博客列表</Link>
      </main>
    );
  }

  // 查当前用户是否收藏过 + 这篇文章的收藏总数
  const favorite = session?.user?.id
    ? await prisma.favorite.findUnique({
        where: { userId_blogId: { userId: session.user.id, blogId: blog.id } },
      })
    : null;
  const favoriteCount = await prisma.favorite.count({ where: { blogId: blog.id } });

  // 相关文章：同分类的其他文章（排除自己，只取3篇）
  const relatedBlogs = await prisma.blog.findMany({
    where: { category: blog.category, id: { not: blog.id } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
    // 评论区数据：这篇文章的所有评论（连带作者信息一起查）
    const comments = await prisma.comment.findMany({
      where: { blogId: blog.id },
      orderBy: { createdAt: "desc" }, // 最新的在最上面
      include: { user: true }, // 新知识：顺带查出每条评论的作者
    });
  
  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
              {/* 阅读量计数：页面打开时自动触发（防刷版） */}
              <ViewCounter blogId={blog.id} />
              <ReadingProgress />
              <BackToTop />
              <HistoryTracker blogId={blog.id} title={blog.title} />
      <div
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <Link href="/blog" style={{ fontSize: 14, color: "var(--text-light)" }}>
          ← 返回博客列表
        </Link>
        {/* 封面图：有封面才显示 */}
        {blog.coverImage ? (
          <Image
            src={blog.coverImage}
            alt={blog.title}
            width={800}
            height={360}
            style={{
              width: "100%",
              maxHeight: "360px",
              objectFit: "cover",
              borderRadius: "10px",
            }}
          />
        ) : null}
        
        <h1 style={{ margin: "16px 0 8px", fontSize: "32px" }}>{blog.title}</h1>
                {/* 标签徽章：有标签才显示 */}
                {blog.tags.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
            {blog.tags.map((bt) => (
              <span
                key={bt.tagId}
                style={{
                  padding: "2px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  background: "#eef2ff",
                  color: "#4338ca",
                }}
              >
                #{bt.tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 作者 + 发布时间 + 阅读量 */}
        <p style={{ color: "var(--text-light)", fontSize: "14px" }}>
          <Link href={`/profile/${blog.userId}`} style={{ color: "var(--link)" }}>
            {blog.user?.name || "匿名"}
          </Link>
          发布于 <RelativeTime time={blog.createdAt} />
          <span style={{ marginLeft: 16 }}>⏱️ 约 {Math.ceil(blog.content.length / 300)} 分钟读完</span>
          <span style={{ marginLeft: 16 }}>📖 阅读量：{blog.views}</span>
          <span style={{ marginLeft: 16 }}>
            <FavoriteBtn
              blogId={blog.id}
              initialFavorited={!!favorite}
              initialCount={favoriteCount}
            />
          </span>
          <ShareBtn />

        </p>

        {/* 文章正文：交给 ReactMarkdown 渲染，支持 Markdown 语法 */}
        <div
          className="md-body"
          style={{
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid var(--card-border)",
            lineHeight: "1.8",
            color: "var(--text)",
          }}
        >
          <ReactMarkdown>{blog.content}</ReactMarkdown>
        </div>

        {/* 评论区：文章下方直接聊天 */}
        <div style={{ marginTop: "32px", borderTop: "1px solid var(--card-border)", paddingTop: "24px" }}>
          <h3 style={{ fontSize: "20px" }}>💬 评论（{comments.length}）</h3>

          {/* 评论列表 */}
          {comments.length === 0 ? (
            <p style={{ color: "var(--text-light)", fontSize: "14px" }}>还没有评论，来抢沙发！</p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid var(--card-border)",
                  padding: "12px 16px",
                  marginTop: "10px",
                  borderRadius: "10px",
                  background: "var(--card-bg)",
                }}
              >
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-light)" }}>
                {c.user?.name || "匿名"} · <RelativeTime time={c.createdAt} />

                </p>
                <p style={{ margin: "6px 0 0", color: "var(--text)" }}>{c.content}</p>
              </div>
            ))
          )}

          {/* 评论输入框 */}
          <CommentForm blogId={blog.id} />
        </div>


        {/* 相关文章推荐：同分类的其他文章 */}
        {relatedBlogs.length > 0 && (
          <div style={{ marginTop: "32px" }}>
            <h3 style={{ fontSize: "18px" }}>📚 你可能还想看</h3>
            {relatedBlogs.map((rb) => (
              <Link
                href={`/blog/${rb.id}`}
                key={rb.id}
                style={{ display: "block", textDecoration: "none" }}
              >
                <div
                  style={{
                    border: "1px solid var(--card-border)",
                    padding: "12px 16px",
                    marginTop: "8px",
                    borderRadius: "10px",
                    background: "var(--card-bg)",
                  }}
                >
                  <p style={{ margin: 0, color: "var(--link)", fontWeight: 600 }}>
                    {rb.pinned ? "📌 " : ""}
                    {rb.title}
                  </p>
                  <p style={{ margin: "4px 0 0", color: "var(--text-light)", fontSize: "13px" }}>
                    {rb.category} · 📖 阅读量 {rb.views} · <RelativeTime time={rb.createdAt} />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

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
