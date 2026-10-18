import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ViewHistory from "@/app/components/ViewHistory";
import RelativeTime from "@/app/components/RelativeTime";
import { unstable_cache } from "next/cache";

// 统计卡片的长相（4个卡片共用）
const statCard: React.CSSProperties = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  padding: "16px",
  textAlign: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

// 🧠 缓存函数：把首页所有数据库查询包起来
// 第一次访问 → 查库并存起来；60秒内再来 → 直接复用，不跨洋查库 → 秒开
const getHomeData = unstable_cache(
  async () => {
    // 取最新6篇博客
    const latestBlogs = await prisma.blog.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: true },
    });

    // 取阅读量最高的3篇文章（热门榜）
    const hotBlogs = await prisma.blog.findMany({
      where: { status: "published" },
      orderBy: { views: "desc" },   // 按阅读量从高到低排
      take: 3,                      // 只取前3名
      include: { user: true },      // 顺便查出作者
    });
        // 取带系列的文章（第 26 课成果：按系列分组展示）
        const seriesBlogs = await prisma.blog.findMany({
          where: { status: "published", series: { not: null } },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, series: true },
          take: 50,
        });
    

    // 取最新6条留言
    const latestMessages = await prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: true },
    });

    // ====== 统计看板数据（聚合计算）======
    const [blogCount, messageCount, userCount, viewsResult] = await Promise.all([
      prisma.blog.count({ where: { status: "published" } }), // 数已发布的文章有几篇
      prisma.message.count(),                               // 数留言有几条
      prisma.user.count(),                                  // 数用户有几个
      prisma.blog.aggregate({ _sum: { views: true } }),     // 所有文章阅读量加起来
    ]);

    // 把6组数据打包返回
    return {
      seriesBlogs,
      latestBlogs,
      hotBlogs,
      latestMessages,
      blogCount,
      messageCount,
      userCount,
      totalViews: viewsResult._sum.views ?? 0,
    };
  },
  ["home-data"],    // 缓存的"钥匙"（给缓存起名字，以后想手动清用它）
  { revalidate: 60 } // 60秒后作废重新查（数据不会一直旧）
);

export default async function HomePage() {
  // 从缓存拿数据（第一次查库，60秒内直接复用 → 秒开）
  const { seriesBlogs, latestBlogs, hotBlogs, latestMessages, blogCount, messageCount, userCount, totalViews } = await getHomeData();

  return (
    <main style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1 className="home-title" style={{ fontSize: "44px", margin: 0 }}>
          AizyBase{" "}
          <span
            style={{
              background: "linear-gradient(135deg,#6366f1,#a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI 资源库
          </span>
        </h1>
        <p style={{ color: "var(--text-light)", marginTop: 12, fontSize: 17 }}>
          教程 · 工具 · 灵感，一站式收藏，跟着系列慢慢学
        </p>
        <div
          className="home-btns"
          style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: 28 }}
        >
          <Link href="/blog">
            <button
              style={{
                padding: "12px 28px",
                fontSize: 16,
                borderRadius: "999px",
                border: "none",
                background: "linear-gradient(135deg,#6366f1,#a855f7)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              📚 浏览资源
            </button>
          </Link>
          <Link href="/message">
            <button
              style={{
                padding: "12px 28px",
                fontSize: 16,
                borderRadius: "999px",
                border: "1px solid var(--card-border)",
                background: "var(--card-bg)",
                color: "var(--text)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              💬 留言交流
            </button>
          </Link>
        </div>
      </div>

            {/* 最近看过：从浏览器小仓库读记录 */}
            <ViewHistory />

      {/* 📊 网站数据统计：4个数字小卡片 */}
      <div
        className="home-stats"
        style={{
          display: "grid",
          gap: "12px",
          gridTemplateColumns: "repeat(4, 1fr)",
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

      <div className="home-sections" style={{ display: "grid", gap: "40px" }}>
                {/* 📚 系列专栏：第 26 课成果，把文章串成追更清单 */}
                <div>
          <h2 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8 }}>📚 系列专栏</h2>
          <div style={{ marginTop: 16 }}>
            {(() => {
              // 把带系列的文章按系列名分组（最新在前）
              const groups = new Map<
                string,
                { latestTitle: string; latestId: string; count: number }
              >();
              for (const b of seriesBlogs) {
                const name = b.series || "";
                if (!groups.has(name)) {
                  groups.set(name, { latestTitle: b.title, latestId: b.id, count: 0 });
                }
                groups.get(name)!.count++;
              }
              return [...groups.entries()].map(([name, g]) => (
                <div
                  key={name}
                  style={{
                    border: "1px solid var(--card-border)",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 10,
                    background: "var(--card-bg)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Link
                      href={`/series/${encodeURIComponent(name)}`}
                      style={{ color: "var(--link)", fontWeight: "bold", textDecoration: "none" }}
                    >
                      📚 {name}
                    </Link>
                    <span style={{ fontSize: 13, color: "var(--text-light)" }}>{g.count} 篇</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-light)", marginTop: 6 }}>
                    最新：《
                    <Link href={`/blog/${g.latestId}`} style={{ color: "#2563eb" }}>
                      {g.latestTitle}
                    </Link>
                    》
                  </p>
                </div>
              ));
            })()}
            {seriesBlogs.length === 0 && (
              <p style={{ color: "var(--text-light)" }}>还没有系列，写文章时填个系列名试试</p>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href="/blog" style={{ color: "#2563eb" }}>去逛文章 →</Link>
          </div>
        </div>

        {/* 📝最新博客区域，下面循环出来的每一个div就是【博客卡片】 */}
        <div>
          <h2 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8 }}>📝 最新博客</h2>
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {latestBlogs.length === 0 ? (
              <p style={{ color: "var(--text-light)" }}>暂无博客文章</p>
            ) : (
              latestBlogs.map((blog) => (
                <div
                  key={blog.id}
                  style={{
                    border: "1px solid var(--card-border)",
                    padding: 14,
                    borderRadius: 10,
                    background: "var(--card-bg)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    width: "calc(33.333% - 12px)",
                    minWidth: "220px",
                    boxSizing: "border-box",
                  }}
                >
                  <Link href={`/blog/${blog.id}`}>
                    <h3 style={{ margin: 0, color: "var(--link)", fontSize: 16 }}>{blog.title}</h3>
                  </Link>
                  <p style={{ fontSize: 13, color: "var(--text-light)", marginTop: 6 }}>
                    <Link href={`/profile/${blog.userId}`} style={{ color: "#2563eb" }}>
                      {blog.user?.name || "匿名"}
                    </Link>
                    &nbsp;<RelativeTime time={blog.createdAt} />
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
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {latestMessages.length === 0 ? (
              <p style={{ color: "var(--text-light)" }}>暂无留言</p>
            ) : (
              latestMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    border: "1px solid var(--card-border)",
                    padding: 14,
                    borderRadius: 10,
                    background: "var(--card-bg)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    width: "calc(33.333% - 12px)",
                    minWidth: "220px",
                    boxSizing: "border-box",
                  }}
                >
                  <p style={{ fontSize: 13, margin: 0 }}>
                    <Link href={`/profile/${msg.userId}`} style={{ color: "#2563eb" }}>
                      {msg.name || msg.user?.name || "匿名"}
                    </Link>
                    &nbsp;<RelativeTime time={msg.createdAt} />
                  </p>
                  <p style={{ marginTop: 6, fontSize: 14 }}>{msg.content}</p>
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