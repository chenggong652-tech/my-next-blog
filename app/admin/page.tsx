import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import AdminDeleteBtn from "@/app/components/AdminDeleteBtn";
import AdminPublishBtn from "@/app/components/AdminPublishBtn";
import AdminCommentDeleteBtn from "@/app/components/AdminCommentDeleteBtn";
import ResourceSaleForm from "./ResourceSaleForm";
import { createSong, deleteSong } from "./music-actions";
import MusicAdmin from "./MusicAdmin";


// 后台专属 SEO：独立标题 + 永不收录（就算将来全站开放收录，后台也进不了搜索引擎）
export const metadata: Metadata = {
  title: "⚙️ 后台管理 | AizyBase",
  robots: { index: false, follow: false },
};

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

// 🅰️ A2 补丁：后台统计卡片缓存——数字不常变，30秒内直接复用上次结果，不用每次跨洋重查
const getStats = unstable_cache(
  async () => {
    const [userCount, blogCount, messageCount, commentCount, favoriteCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.blog.count(),
        prisma.message.count(),
        prisma.comment.count(),
        prisma.favorite.count(),
      ]);
    return { userCount, blogCount, messageCount, commentCount, favoriteCount };
  },
  ["admin-stats"],
  { revalidate: 30 }
);

// 🅰️ A2 补丁：音乐看板统计缓存（总数/播放/风格，30秒复用）
const getMusicStats = unstable_cache(
  async () => {
    const [songCount, songPlaySum, genreGroups, topSongs, genrePlaySum] = await Promise.all([
      prisma.song.count(),
      prisma.song.aggregate({ _sum: { plays: true } }),
      prisma.song.groupBy({ by: ["genre"], _count: true }),
      prisma.song.findMany({ orderBy: { plays: "desc" }, take: 5, select: { title: true, plays: true, status: true } }),
      prisma.song.groupBy({ by: ["genre"], _sum: { plays: true } }), // 每个风格的播放合计
    ]);
    return { songCount, songPlaySum, genreGroups, topSongs, genrePlaySum };
  },
  ["admin-music-stats"],
  { revalidate: 30 }
);


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

  // 2. 统计全站数据（缓存版：30秒内复用，不用每次跨洋重查）
  const { userCount, blogCount, messageCount, commentCount, favoriteCount } = await getStats();

  const stats = [
    { label: "👥 注册用户", value: userCount },
    { label: "📝 文章总数", value: blogCount },
    { label: "💬 留言总数", value: messageCount },
    { label: "🗨️ 评论总数", value: commentCount },
    { label: "❤️ 收藏总数", value: favoriteCount },
  ];
  
  // 3-7. 文章/用户/评论/歌曲/日志 —— 5 个查询一起并行发（同时查，谁先回先收，总时间=最慢那个，不再排队等）
  const [allBlogs, allUsers, allComments, allSongs, recentLogs] = await Promise.all([
    prisma.blog.findMany({ orderBy: { createdAt: "desc" }, include: { user: true } }), // 所有文章（连带作者名）
    prisma.user.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { blogs: true } } } }), // 所有用户（_count 顺带数每人发了多少篇文章）
    prisma.comment.findMany({ orderBy: { createdAt: "desc" }, include: { user: true, blog: true } }), // 所有评论（连带"谁评论的"+"评论哪篇"）
    prisma.song.findMany({ orderBy: { createdAt: "desc" } }), // 所有歌曲（最新的在前）
    prisma.operationLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }), // 最近操作日志（取20条）
  ]);

    // 📊 音乐数据看板统计（缓存版：30秒复用）
    const { songCount, songPlaySum, genreGroups, topSongs, genrePlaySum } = await getMusicStats();
    const maxGenrePlays = Math.max(...genrePlaySum.map((g) => g._sum.plays || 0), 1); // 风格最大播放数（算比例用）
    const maxSongPlays = Math.max(...topSongs.map((s) => s.plays), 1); // 热歌最大播放数

    // 🅲1 所有资源（促销管理用）
    const allResources = await prisma.resource.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, title: true, price: true, discountPrice: true, discountEndAt: true, status: true },
    });
    

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: "28px" }}>⚙️ 管理后台</h1>
      <p style={{ color: "var(--text-light)" }}>全站数据总览</p>

      <p style={{ margin: "10px 0 0" }}>
        <a
          href="/admin/dashboard"
          style={{
            display: "inline-block",
            padding: "8px 16px",
            borderRadius: 8,
            background: "#6366f1",
            color: "#fff",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          📊 打开商业数据看板
        </a>
      </p>
      <p style={{ margin: "10px 0 0" }}>
        <a
          href="/admin/logs"
          style={{
            display: "inline-block",
            padding: "8px 16px",
            borderRadius: 8,
            background: "#f59e0b",
            color: "#fff",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          📜 操作日志
        </a>
      </p>
      <p style={{ margin: "10px 0 0" }}>
        <a
          href="/admin/badwords"
          style={{
            display: "inline-block",
            padding: "8px 16px",
            borderRadius: 8,
            background: "#dc2626",
            color: "#fff",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          🔞 敏感词库
        </a>
      </p>

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

    
      <Link href="/stats" style={{ color: "var(--link)", display: "inline-block", marginTop: "16px" }}>
        📊 访问统计 →
      </Link>

      {/* 🅲1 资源促销管理：给商品上"限时折扣" */}
      <h2 style={{ fontSize: "22px", marginTop: "40px" }}>🎁 资源促销管理（{allResources.length}）</h2>
      <div style={{ marginTop: "12px" }}>
        {allResources.map((r) => (
          <ResourceSaleForm key={r.id} r={r} />
        ))}
        {allResources.length === 0 && (
          <p style={{ color: "var(--text-light)", fontSize: "14px" }}>还没有资源</p>
        )}
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
              {b.status === "draft" && (
                <span style={{ display: "inline-block", marginTop: "6px", padding: "2px 8px", borderRadius: "4px", background: "#fef9c3", color: "#854d0e", fontSize: "12px" }}>
                  📝 草稿
                </span>
              )}

              {/* 🅰️ A2 第二站：SEO 体检仪——3格全填=绿灯，缺=黄灯，全空=红灯 */}
              <span
                style={{
                  display: "inline-block",
                  marginTop: "6px",
                  marginLeft: "8px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  background:
                    b.seoTitle && b.seoDescription && b.keywords
                      ? "#dcfce7"
                      : b.seoTitle || b.seoDescription || b.keywords
                      ? "#fef9c3"
                      : "#fee2e2",
                  color:
                    b.seoTitle && b.seoDescription && b.keywords
                      ? "#166534"
                      : b.seoTitle || b.seoDescription || b.keywords
                      ? "#854d0e"
                      : "#991b1b",
                }}
              >
                {b.seoTitle && b.seoDescription && b.keywords
                  ? "🟢 SEO 完善"
                  : b.seoTitle || b.seoDescription || b.keywords
                  ? "🟡 SEO 补 " +
                    [b.seoTitle, b.seoDescription, b.keywords].filter((x) => !x).length +
                    " 项"
                  : "🔴 SEO 空白"}
              </span>

            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {b.status === "draft" && (
                <>
                  <Link href={`/blog/${b.id}/edit`} style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid #f59e0b", color: "#f59e0b", fontSize: "13px", textDecoration: "none" }}>
                    ✏️ 编辑
                  </Link>
                  <AdminPublishBtn blogId={b.id} />
                </>
              )}
              <AdminDeleteBtn blogId={b.id} />
            </div>
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

      {/* 评论管理：所有评论，管理员可删 */}
      <h2 style={{ fontSize: "22px", marginTop: "40px" }}>💬 评论管理（{allComments.length}）</h2>
      <div style={{ marginTop: "12px" }}>
        {allComments.map((c) => (
          <div
            key={c.id}
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
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, wordBreak: "break-word" }}>{c.content}</p>
              <p style={{ margin: "4px 0 0", color: "var(--text-light)", fontSize: "13px" }}>
                {c.user?.name || "匿名"} · 评论于《{c.blog.title}》 · {c.createdAt.toLocaleString()}
              </p>
            </div>
            <AdminCommentDeleteBtn commentId={c.id} />
          </div>
        ))}
        {allComments.length === 0 && (
          <p style={{ color: "var(--text-light)", fontSize: "14px" }}>还没有评论</p>
        )}
      </div>

            {/* 📊 音乐数据看板 */}
            <h2 style={{ fontSize: "22px", marginTop: "40px" }}>📊 音乐数据看板</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginTop: "12px" }}>
              <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", padding: "16px", background: "var(--card-bg)", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>{songCount}</p>
                <p style={{ margin: "6px 0 0", color: "var(--text-light)", fontSize: "13px" }}>总歌曲数</p>
              </div>
              <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", padding: "16px", background: "var(--card-bg)", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>{songPlaySum._sum.plays || 0}</p>
                <p style={{ margin: "6px 0 0", color: "var(--text-light)", fontSize: "13px" }}>总播放次数</p>
              </div>
              <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", padding: "16px", background: "var(--card-bg)", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>{genreGroups.length}</p>
                <p style={{ margin: "6px 0 0", color: "var(--text-light)", fontSize: "13px" }}>风格数量</p>
              </div>
            </div>

            <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: "12px" }}>
              {/* 最热 Top5（带热度条） */}
              <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", padding: "16px", background: "var(--card-bg)" }}>
                <h3 style={{ margin: 0, fontSize: "15px" }}>🔥 最热 Top5 热度条</h3>
                <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                  {topSongs.map((s, i) => (
                    <div key={s.title}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span>{i + 1}. {s.title} {s.status === "hidden" ? "🔒" : ""}</span>
                        <span style={{ color: "var(--text-light)" }}>▶ {s.plays} 次</span>
                      </div>
                      {/* 进度条：宽度 = 这首歌播放 ÷ 最高播放 × 100% */}
                      <div style={{ background: "var(--card-border)", borderRadius: "6px", height: "8px", marginTop: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${(s.plays / maxSongPlays) * 100}%`, height: "100%", borderRadius: "6px", background: "linear-gradient(90deg,#f59e0b,#dc2626)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* 风格播放分布（横向柱状图） */}
              <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", padding: "16px", background: "var(--card-bg)" }}>
                <h3 style={{ margin: 0, fontSize: "15px" }}>🎚️ 风格播放分布</h3>
                <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                  {genrePlaySum.map((g) => (
                    <div key={g.genre}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span>{g.genre}</span>
                        <span style={{ color: "var(--text-light)" }}>▶ {g._sum.plays || 0} 次</span>
                      </div>
                      <div style={{ background: "var(--card-border)", borderRadius: "6px", height: "8px", marginTop: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${((g._sum.plays || 0) / maxGenrePlays) * 100}%`, height: "100%", borderRadius: "6px", background: "linear-gradient(90deg,#f59e0b,#dc2626)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 🎵 音乐管理：发布新歌 + 歌曲列表 */}
            <h2 style={{ fontSize: "22px", marginTop: "40px" }}>🎵 音乐管理（{allSongs.length}）</h2>

{/* 发布表单：填好一首歌的信息，提交就入库 */}
<form
  action={createSong}
  style={{
    border: "1px solid var(--card-border)",
    borderRadius: "12px",
    padding: "16px",
    background: "var(--card-bg)",
    marginTop: "12px",
    display: "grid",
    gap: "10px",
  }}
>
  <input name="title" placeholder="歌名（必填）" required style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--card-border)" }} />
  <input name="genre" placeholder="风格（如：电子/流行/古风）" defaultValue="未分类" style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--card-border)" }} />
  <input name="cover" placeholder="封面路径（如 /music/covers/snow-tower.webp）" style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--card-border)" }} />
  <input name="audioUrl" placeholder="音频路径（必填，如 /music/snow-tower.mp3）" required style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--card-border)" }} />
  <textarea name="lyrics" placeholder="歌词（可选，每行一句）" rows={4} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--card-border)" }} />
  <label style={{ fontSize: "14px", color: "var(--text-light)" }}>
    <input type="checkbox" name="isOriginal" defaultChecked /> AI 原创（勾选=可商用；翻唱别勾）
  </label>
  <button type="submit" style={{ padding: "10px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", fontSize: "15px", cursor: "pointer" }}>
    🚀 发布这首歌
  </button>
</form>

{/* 歌曲列表：每首可 ✏️ 编辑 / 🗑️ 删除 */}
<MusicAdmin songs={allSongs} />

        {/* 🕵️ 操作日志：谁删了文章/评论都能查 */}
        <h2 style={{ fontSize: "22px", marginTop: "40px" }}>🕵️ 操作日志（最近 {recentLogs.length} 条）</h2>
        <div style={{ marginTop: "12px" }}>
          {recentLogs.map((log) => (
            <div
              key={log.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                border: "1px solid var(--card-border)",
                padding: "10px 16px",
                marginTop: "8px",
                borderRadius: "10px",
                background: "var(--card-bg)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>【{log.action}】{log.target}</p>
                <p style={{ margin: "4px 0 0", color: "var(--text-light)", fontSize: "13px" }}>
                  👤 {log.userName} · {log.createdAt.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {recentLogs.length === 0 && (
            <p style={{ color: "var(--text-light)", fontSize: "14px" }}>还没有操作记录（删一篇文章试试）</p>
          )}
        </div>

    </main>
  );
}
