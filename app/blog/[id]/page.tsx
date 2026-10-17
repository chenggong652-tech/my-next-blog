// app/blog/[id]/page.tsx
// 动态路由：/blog/任意文章id 都会进入这个页面
import BlogDeleteBtn from "@/app/components/BlogDeleteBtn";
import ViewCounter from "@/app/components/ViewCounter";
import FavoriteBtn from "@/app/components/FavoriteBtn";
import BackToTop from "@/app/components/BackToTop";
import ReadingProgress from "@/app/components/ReadingProgress";
import ShareBtn from "@/app/components/ShareBtn";
import CommentForm from "@/app/components/CommentForm";
import CommentLikeBtn from "@/app/components/CommentLikeBtn";
import CommentReplyBox from "@/app/components/CommentReplyBox";
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
  // 清洗 Markdown 排版符号（# * > ` - [ ] ( ) ! 等），把正文变成纯文字
  const plain = blog.content
    .replace(/[#>*`\-\[\]()!]/g, "")
    .replace(/\s+/g, " ")          // 多个空格/换行合并成一个空格
    .trim();
  // 截取正文前 60 个字当摘要，超过就加省略号
  const description = plain.slice(0, 60) + (plain.length > 60 ? "…" : "");

  return {
    // 标题加品牌后缀：分享/搜索显示"文章标题 | AizyBase"
    title: `${blog.title} | AizyBase`,
    description: description,
    // 社交分享卡片：发微信/朋友圈时，对方看到的小卡片内容
    openGraph: {
      title: blog.title,
      description: description,
      type: "article",
      images: blog.coverImage ? [{ url: blog.coverImage }] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ cpage?: string }> }) {
  const { id } = await params;
  // 评论分页参数：URL 上 ?cpage=2 就是第2页（没有就默认第1页）
  const commentPage = Math.max(1, Number((await searchParams)?.cpage) || 1);

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
        // 评论区数据：这篇文章的评论（每页5条，连带回复和作者）
        const COMMENT_PAGE_SIZE = 5; // 每页显示 5 条评论
        const [comments, commentTotal] = await Promise.all([
          prisma.comment.findMany({
            where: { blogId: blog.id },
            orderBy: { createdAt: "desc" }, // 最新的在最上面
            skip: (commentPage - 1) * COMMENT_PAGE_SIZE, // 跳过前面几页的条数
            take: COMMENT_PAGE_SIZE,                     // 只取这一页的条数
            include: {
              user: true, // 顺带查出每条评论的作者
              _count: { select: { likes: true } }, // 顺带数每条评论的点赞数
              replies: { include: { user: true }, orderBy: { createdAt: "asc" } }, // 回复（连带回复作者，从旧到新）
            },
          }),
          prisma.comment.count({ where: { blogId: blog.id } }), // 评论总数（算分页用）
        ]);
        const commentTotalPage = Math.ceil(commentTotal / COMMENT_PAGE_SIZE); // 总共有几页
    

    // 当前用户给哪些评论点过赞（收藏按钮的套路：查"我赞过的"集合）
    const myLikes = session?.user?.id
      ? await prisma.commentLike.findMany({
          where: { userId: session.user.id, commentId: { in: comments.map((c) => c.id) } },
          select: { commentId: true },
        })
      : [];
    const likedSet = new Set(myLikes.map((l) => l.commentId));

      // 上一篇/下一篇：按发布时间找（lt=比我早 gt=比我晚）
  // select：只取 id 和标题（轻量查询，不拖全部字段）
  const prevBlog = await prisma.blog.findFirst({
    where: { createdAt: { lt: blog.createdAt } }, // 新知识：发布时间比我早的
    orderBy: { createdAt: "desc" },               // 从新到旧排 → 取最新的那篇旧的 = 上一篇
    select: { id: true, title: true },            // 新知识：只取需要的字段
  });
  const nextBlog = await prisma.blog.findFirst({
    where: { createdAt: { gt: blog.createdAt } }, // 发布时间比我晚的
    orderBy: { createdAt: "asc" },                // 从旧到新排 → 取最早的那篇新的 = 下一篇
    select: { id: true, title: true },
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

        {/* 上一篇/下一篇导航：看完正文，顺着读 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            marginTop: "32px",
            borderTop: "1px solid var(--card-border)",
            paddingTop: "20px",
          }}
        >
          {prevBlog ? (
            <Link href={`/blog/${prevBlog.id}`} style={{ textDecoration: "none", color: "var(--text-light)", maxWidth: "45%" }}>
              <span style={{ fontSize: 13 }}>← 上一篇</span>
              <div style={{ color: "var(--link)", fontWeight: 600, marginTop: 4 }}>{prevBlog.title}</div>
            </Link>
          ) : (
            <span />
          )}
          {nextBlog ? (
            <Link
              href={`/blog/${nextBlog.id}`}
              style={{ textDecoration: "none", color: "var(--text-light)", textAlign: "right", maxWidth: "45%" }}
            >
              <span style={{ fontSize: 13 }}>下一篇 →</span>
              <div style={{ color: "var(--link)", fontWeight: 600, marginTop: 4 }}>{nextBlog.title}</div>
            </Link>
          ) : (
            <span />
          )}
        </div>

        {/* 评论区：文章下方直接聊天 */}
        <div style={{ marginTop: "32px", borderTop: "1px solid var(--card-border)", paddingTop: "24px" }}>
        <h3 style={{ fontSize: "20px" }}>💬 评论（{commentTotal}）</h3>

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
      
      <div style={{ marginTop: "8px", display: "flex", gap: "12px" }}>
        <CommentLikeBtn commentId={c.id} initialLiked={likedSet.has(c.id)} initialCount={c._count.likes} />
        <CommentReplyBox blogId={blog.id} commentId={c.id} />
      </div>

      {/* 这条评论的回复列表 */}
      {c.replies.length > 0 && (
        <div style={{ marginTop: "10px", borderLeft: "3px solid var(--card-border)", paddingLeft: "12px" }}>
          {c.replies.map((r) => (
            <div key={r.id} style={{ marginTop: "8px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-light)" }}>
                {r.user?.name || "匿名"} 回复 · <RelativeTime time={r.createdAt} />
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--text)" }}>{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  ))
)}

{/* 评论分页：评论多了，一页看不下 */}
{commentTotalPage > 1 && (
  <div style={{ display: "flex", gap: "12px", marginTop: "16px", alignItems: "center" }}>
    {commentPage <= 1 ? (
      <button disabled style={{ opacity: 0.4, cursor: "not-allowed" }}>上一页</button>
    ) : (
      <Link href={`/blog/${blog.id}?cpage=${commentPage - 1}`}>
        <button>上一页</button>
      </Link>
    )}
    <span>{commentPage} / {commentTotalPage}</span>
    {commentPage >= commentTotalPage ? (
      <button disabled style={{ opacity: 0.4, cursor: "not-allowed" }}>下一页</button>
    ) : (
      <Link href={`/blog/${blog.id}?cpage=${commentPage + 1}`}>
        <button>下一页</button>
      </Link>
    )}
  </div>
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
