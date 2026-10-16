import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import AdminDeleteBtn from "@/app/components/AdminDeleteBtn";

// 备份按钮的长相
const btn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "#fff",
  textDecoration: "none",
  fontSize: "14px",
};


// 后台主页：只有管理员能看
export default async function AdminPage() {
  // 1. 检查权限：不是管理员 → 直接拒绝
  const admin = await isAdmin();
  if (!admin) {
    return (
      <main style={{ maxWidth: "800px", margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "28px" }}>🔒 无权访问</h1>
        <p style={{ color: "var(--text-light)" }}>这里只有管理员能进哦</p>
        <Link href="/" style={{ color: "var(--link)" }}>← 回首页</Link>
      </main>
    );
  }

  // 2. 统计全站数据（count = 数一数每张表有多少条）
  const [userCount, blogCount, messageCount, commentCount, favoriteCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.blog.count(),
      prisma.message.count(),
      prisma.comment.count(),
      prisma.favorite.count(),
    ]);

  const stats = [
    { label: "👥 注册用户", value: userCount },
    { label: "📝 文章总数", value: blogCount },
    { label: "💬 留言总数", value: messageCount },
    { label: "🗨️ 评论总数", value: commentCount },
    { label: "❤️ 收藏总数", value: favoriteCount },
  ];
  
  // 3. 所有文章（连带作者名一起查，最新的在前）
  const allBlogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  // 4. 所有用户（新知识：_count 顺带数每人发了多少篇文章）
  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { blogs: true } } },
  });

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: "28px" }}>⚙️ 管理后台</h1>
      <p style={{ color: "var(--text-light)" }}>全站数据总览</p>

      {/* 统计卡片：一排 5 个数字 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginTop: "20px" }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: "12px",
              padding: "20px",
              background: "var(--card-bg)",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold", color: "var(--link)" }}>
              {s.value}
            </p>
            <p style={{ margin: "8px 0 0", color: "var(--text-light)", fontSize: "14px" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* 数据备份：一键下载 CSV（记得定期备份！） */}
      <div
        style={{
          marginTop: "24px",
          border: "1px solid var(--card-border)",
          borderRadius: "12px",
          padding: "16px",
          background: "var(--card-bg)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px" }}>📥 数据备份</h3>
        <p style={{ margin: "6px 0 12px", color: "var(--text-light)", fontSize: "13px" }}>
          定期下载，数据在手心里才踏实
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a href="/api/export?type=blogs" style={btn}>📄 导出文章</a>
          <a href="/api/export?type=messages" style={btn}>💬 导出留言</a>
          <a href="/api/export?type=users" style={btn}>👥 导出用户</a>
        </div>
      </div>
      
      {/* 文章管理：所有文章，管理员可删 */}
      <h2 style={{ fontSize: "22px", marginTop: "40px" }}>📝 文章管理（{allBlogs.length}）</h2>
      <div style={{ marginTop: "12px" }}>
        {allBlogs.map((b) => (
          <div
            key={b.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid var(--card-border)",
              padding: "10px 16px",
              marginTop: "8px",
              borderRadius: "10px",
              background: "var(--card-bg)",
            }}
          >
            <div>
              <Link href={`/blog/${b.id}`} style={{ color: "var(--link)", fontWeight: 600, textDecoration: "none" }}>
                {b.title}
              </Link>
              <p style={{ margin: "4px 0 0", color: "var(--text-light)", fontSize: "13px" }}>
                {b.user?.name || "匿名"} · {b.category} · 📖 {b.views}
              </p>
            </div>
            <AdminDeleteBtn blogId={b.id} />
          </div>
        ))}
      </div>

      {/* 用户管理：所有注册用户 */}
      <h2 style={{ fontSize: "22px", marginTop: "40px" }}>👥 用户管理（{allUsers.length}）</h2>
      <div style={{ marginTop: "12px" }}>
        {allUsers.map((u) => (
          <div
            key={u.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid var(--card-border)",
              padding: "10px 16px",
              marginTop: "8px",
              borderRadius: "10px",
              background: "var(--card-bg)",
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>{u.name || "未设置昵称"}</p>
              <p style={{ margin: "4px 0 0", color: "var(--text-light)", fontSize: "13px" }}>
                {u.email} · 注册于 {u.createdAt.toLocaleString()}
              </p>
            </div>
            <span style={{ fontSize: "13px", color: "var(--link)" }}>
              📝 {u._count.blogs} 篇
            </span>
          </div>
        ))}
      </div>

    </main>
  );
}
