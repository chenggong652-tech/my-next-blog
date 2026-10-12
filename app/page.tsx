import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  // 取最新3篇博客
  const latestBlogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { user: true },
  });

  // 取最新3条留言
  const latestMessages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { user: true },
  });

  return (
    <main style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1 style={{ fontSize: "36px" }}>我的简易博客网站</h1>
        <p style={{ color: "#666", marginTop: 10 }}>分享文字，互相留言交流</p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: 24 }}>
          <Link href="/blog">
            <button style={{ padding: "10px 20px", fontSize: 16, borderRadius:"8px" }}>进入博客列表</button>
          </Link>
          <Link href="/message">
            <button style={{ padding: "10px 20px", fontSize: 16, borderRadius:"8px" }}>前往留言板</button>
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
        {/* 📝最新博客区域，下面循环出来的每一个div就是【博客卡片】 */}
        <div>
          <h2 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8 }}>📝 最新博客</h2>
          <div style={{ marginTop: 16 }}>
            {latestBlogs.length === 0 ? (
              <p style={{ color: "#666" }}>暂无博客文章</p>
            ) : (
              latestBlogs.map((blog) => (
                <div
                  key={blog.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 10,
                    background: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <Link href={`/blog/${blog.id}`}>
                    <h3 style={{ margin: 0, color: "#2563eb" }}>{blog.title}</h3>
                  </Link>
                  <p style={{ fontSize: 13, color: "#666", marginTop:6 }}>
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
              <p style={{ color: "#666" }}>暂无留言</p>
            ) : (
              latestMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 10,
                    background: "#ffffff",
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
      </div>
    </main>
  );
}