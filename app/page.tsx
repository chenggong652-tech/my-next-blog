import { prisma } from "@/lib/prisma";
import Link from "next/link";

// 统计卡片的长相（4个卡片共用）
const statCard: React.CSSProperties = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  padding: "16px",
  textAlign: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

export default async function HomePage() {
  // 取最新3篇博客
  const latestBlogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { user: true },
  });
  
  // 取阅读量最高的3篇文章（热门榜）
  const hotBlogs = await prisma.blog.findMany({
    orderBy: { views: "desc" },   // 按阅读量从高到低排
    take: 3,                      // 只取前3名
    include: { user: true },      // 顺便查出作者
  });

  // 取最新3条留言
  const latestMessages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { user: true },
  });
  
  // ====== 统计看板数据（聚合计算）======
  const [blogCount, messageCount, userCount, viewsResult] = await Promise.all([
    prisma.blog.count(),                                  // 数文章有几篇
    prisma.message.count(),                               // 数留言有几条
    prisma.user.count(),                                  // 数用户有几个
    prisma.blog.aggregate({ _sum: { views: true } }),     // 所有文章阅读量加起来
  ]);
  const totalViews = viewsResult._sum.views ?? 0;         // 求和结果；没有文章时是 null，就按 0 算

  return (
    <main style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1 style={{ fontSize: "36px" }}>我的简易博客网站</h1>
        <p style={{ color: "var(--text-light)", marginTop: 10 }}>分享文字，互相留言交流</p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: 24 }}>
          <Link href="/blog">
            <button style={{ padding: "10px 20px", fontSize: 16, borderRadius:"8px" }}>进入博客列表</button>
          </Link>
          <Link href="/message">
            <button style={{ padding: "10px 20px", fontSize: 16, borderRadius:"8px" }}>前往留言板</button>
          </Link>
        </div>
      </div>

      {/* 📊 网站数据统计：4个数字小卡片 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "12px",
          marginBottom: "40px",
        }}
      >
        <div style={statCard}>
          <div style={{ fontSize: "13px", color: "var(--text-light)" }}>📝 文章</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: 4 }}>{blogCount} 篇</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: "13px", color: "var(--text-light)" }}>💬 留言</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: 4 }}>{messageCount} 条</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: "13px", color: "var(--text-light)" }}>👥 用户</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: 4 }}>{userCount} 个</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: "13px", color: "var(--text-light)" }}>👀 总阅读</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: 4 }}>{totalViews} 次</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "40px" }}>
        {/* 📝最新博客区域，下面循环出来的每一个div就是【博客卡片】 */}
        <div>
          <h2 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8 }}>📝 最新博客</h2>
          <div style={{ marginTop: 16 }}>
            {latestBlogs.length === 0 ? (
              <p style={{ color: "var(--text-light)" }}>暂无博客文章</p>
            ) : (
              latestBlogs.map((blog) => (
                <div
                  key={blog.id}
                  style={{
                    border: "1px solid var(--card-border)",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 10,
                    background: "var(--card-bg)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <Link href={`/blog/${blog.id}`}>
                    <h3 style={{ margin: 0, color: "var(--link)" }}>{blog.title}</h3>
                  </Link>
                  <p style={{ fontSize: 13, color: "var(--text-light)", marginTop:6 }}>
                    <Link href={`/profile/${blog.userId}`} style={{color:"#2563eb"}}>
                      {blog.user?.name || "匿名"}
                    </Link>
                    &nbsp;{blog.createdAt.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <div style={{ marginTop:12 }}>
            <Link href="/blog" style={{color:"#2563eb"}}>查看全部博客 →</Link>
          </div>
        </div>

        {/* 💬最新留言区域，循环出来的div就是【留言卡片】 */}
        <div>
          <h2 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8 }}>💬 最新留言</h2>
          <div style={{ marginTop: 16 }}>
            {latestMessages.length === 0 ? (
              <p style={{ color: "var(--text-light)" }}>暂无留言</p>
            ) : (
              latestMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    border: "1px solid var(--card-border)",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 10,
                    background: "var(--card-bg)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <p style={{fontSize:13, margin:0}}>
                    <Link href={`/profile/${msg.userId}`} style={{color:"#2563eb"}}>
                      {msg.user?.name || "匿名"}
                    </Link>
                    &nbsp;{msg.createdAt.toLocaleString()}
                  </p>
                  <p style={{marginTop:6}}>{msg.content}</p>
                </div>
              ))
            )}
          </div>
          <div style={{ marginTop:12 }}>
            <Link href="/message" style={{color:"#2563eb"}}>查看全部留言 →</Link>
          </div>
        </div>

        {/* 🔥热门文章区域：按阅读量排行 */}
        <div>
          <h2 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8 }}>🔥 热门文章</h2>
          <div style={{ marginTop: 16 }}>
            {hotBlogs.length === 0 ? (
              <p style={{ color: "var(--text-light)" }}>暂无文章</p>
            ) : (
              hotBlogs.map((blog) => (
                <div
                  key={blog.id}
                  style={{
                    border: "1px solid var(--card-border)",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 10,
                    background: "var(--card-bg)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <Link href={`/blog/${blog.id}`}>
                    <h3 style={{ margin: 0, color: "var(--link)" }}>{blog.title}</h3>
                  </Link>
                  <p style={{ fontSize: 13, color: "var(--text-light)", marginTop: 6 }}>
                    <Link href={`/profile/${blog.userId}`} style={{ color: "var(--link)" }}>
                      {blog.user?.name || "匿名"}
                    </Link>
                    &nbsp;·&nbsp;👀 {blog.views} 次阅读
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}