import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";

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
    </main>
  );
}
