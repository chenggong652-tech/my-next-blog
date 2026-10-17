import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

// 获取用户信息 + 该用户所有博客 + 该用户所有留言
async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      blogs: {
        orderBy: { createdAt: "desc" },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 10, // 最多显示最近 10 条留言
      },
      favorites: {
        orderBy: { createdAt: "desc" },
        take: 10, // 最多显示最近收藏的 10 篇
        include: { blog: true }, // 顺带查出每篇收藏的文章
      },
    },
  });
  return user;
}

export default async function UserPage({ params }: { params: Promise<{ userId: string }> }) {
  // Next.js 15+ 的 params 是异步的，必须 await 解开才能拿到 userId
  const { userId } = await params;

  const session = await auth();
  const userData = await getUserData(userId);
    // 统计：这个用户的收藏数 + 留言总数（count = 聚合查询，新知识）
    const [favoriteCount, messageCount] = await Promise.all([
      prisma.favorite.count({ where: { userId } }),
      prisma.message.count({ where: { userId } }),
    ]);  

  if (!userData) {
    return <div style={{padding:"40px"}}>用户不存在</div>;
  }

  const isSelf = session?.user?.id === userData.id;

  return (
    <main style={{ maxWidth: "960px", margin: "0 auto", padding: "24px" }}>
      <div style={{ borderBottom: "1px solid var(--card-border)", paddingBottom: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: "32px", margin: 0 }}>{userData.name ?? "匿名用户"}</h1>
        <p style={{ color: "var(--text-light)", marginTop: 8 }}>
          共发布 {userData.blogs.length} 篇文章 · {messageCount} 条留言 · 收藏了 {favoriteCount} 篇文章
        </p>
        {isSelf && (
          <Link href="/blog/new">
            <button style={{ marginTop: 12, padding: "8px 16px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#ffffff", cursor: "pointer" }}>管理我的文章</button>
          </Link>
        )}
      </div>

      <h2 style={{ fontSize: "20px" }}>文章列表</h2>
      <div style={{ margin: "16px 0 32px 0" }}>
        {userData.blogs.map((blog) => (
          <Link href={`/blog/${blog.id}`} key={blog.id}>
            <div
              style={{
                border: "1px solid var(--card-border)",
                padding: 16,
                marginBottom: 12,
                borderRadius: 10,
                background: "var(--card-bg)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {blog.coverImage && (
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  loading="lazy"
                  style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px" }}
                />
              )}
              <h3 style={{ margin: 0, color: "var(--link)" }}>{blog.title}</h3>
              <p style={{ color: "var(--text-light)", fontSize: "14px", marginTop: 8 }}>{blog.createdAt.toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </div>

      <h2 style={{ fontSize: "20px" }}>TA的留言记录</h2>
      <div style={{ margin: "16px 0" }}>
        {userData.messages.length === 0 ? (
          <p style={{ color: "var(--text-light)" }}>TA还没有留言</p>
        ) : (
          userData.messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                border: "1px solid var(--card-border)",
                padding: 16,
                marginBottom: 12,
                borderRadius: 10,
                background: "var(--card-bg)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <p style={{ fontSize: "13px", color: "var(--text-light)", margin: 0 }}>{msg.createdAt.toLocaleString()}</p>
              <p style={{ marginTop: 8 }}>{msg.content}</p>
            </div>
          ))
        )}
      </div>

      <h2 style={{ fontSize: "20px" }}>收藏的文章</h2>
      <div style={{ margin: "16px 0" }}>
        {userData.favorites.length === 0 ? (
          <p style={{ color: "var(--text-light)" }}>还没有收藏</p>
        ) : (
          userData.favorites.map((fav) => (
            <Link href={`/blog/${fav.blog.id}`} key={fav.id}>
              <div
                style={{
                  border: "1px solid var(--card-border)",
                  padding: 16,
                  marginBottom: 12,
                  borderRadius: 10,
                  background: "var(--card-bg)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <h3 style={{ margin: 0, color: "var(--link)" }}>{fav.blog.title}</h3>
                <p style={{ color: "var(--text-light)", fontSize: "14px", marginTop: 8 }}>
                  {fav.blog.category} · 📖 {fav.blog.views}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}