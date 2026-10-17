import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import RelativeTime from "@/app/components/RelativeTime";
import { unstable_cache } from "next/cache";

export const metadata: Metadata = {
  title: "博客列表",
  description: "查看全部博客文章",
};

// 每页展示多少篇
const PAGE_SIZE = 3;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  // 获取当前页码，默认第1页
  const currentPage = Number(params.page) || 1;
  const currentCategory = params.category || "全部";
  const currentTag = params.tag || ""; // 网址里的标签名（没有就是空）
  const skip = (currentPage - 1) * PAGE_SIZE;

    // 组合筛选条件：分类（有就筛）+ 标签（有就筛）
    const where: any = {};
    where.status = "published"; // 只显示已发布的
    if (currentCategory !== "全部") where.category = currentCategory;
    if (currentTag) where.tags = { some: { tag: { name: currentTag } } };
  
      // 🧠 缓存函数：把文章列表查询包起来（复用上一课技能）
  // 钥匙带参数：不同页/分类/标签 = 不同缓存，各存一份不串数据
  const getBlogList = unstable_cache(
    async () => {
      const blogList = await prisma.blog.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: { user: true, tags: { include: { tag: true } } },
        skip: skip,
        take: PAGE_SIZE,
      });
      const totalCount = await prisma.blog.count({ where });
      return { blogList, totalCount };
    },
    ["blog-list", String(currentPage), currentCategory, currentTag], // 钥匙带参数（新知识）；String()把数字变字符串，钥匙只能装字符串
    { revalidate: 60 } // 60秒后作废
  );

  // 从缓存拿列表（不同条件不同缓存，60秒内直接复用 → 秒开）
  const { blogList, totalCount } = await getBlogList();
  const totalPage = Math.ceil(totalCount / PAGE_SIZE);
  const allTags = await prisma.tag.findMany({ orderBy: { name: "asc" } });


  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h1>博客文章列表</h1>
            {/* 分类筛选按钮：点哪个，就看哪类 */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["全部", "未分类", "学习笔记", "生活随笔", "技术教程"].map((cat) => (
          <Link
            key={cat}
            href={cat === "全部" ? "/blog" : `/blog?category=${encodeURIComponent(cat)}`}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              border: "1px solid var(--card-border)",
              background: currentCategory === cat ? "#2563eb" : "#ffffff",
              color: currentCategory === cat ? "#ffffff" : "#333",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            {cat}
          </Link>
        ))}
      </div>
                  {/* 标签筛选按钮：点哪个，只看挂了这个标签的文章 */}
                  {allTags.length > 0 && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                {allTags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/blog?tag=${encodeURIComponent(t.name)}`}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      border: "1px solid var(--card-border)",
                      background: currentTag === t.name ? "#4338ca" : "#ffffff",
                      color: currentTag === t.name ? "#ffffff" : "#333",
                      textDecoration: "none",
                      fontSize: "14px",
                    }}
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}

      {session && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <Link href="/blog/new">
            <button>✏️ 新建文章</button>
          </Link>
          
          <Link href="/api/export?type=blogs">
            <button>📥 导出CSV</button>
          </Link>

          <Link href="/blog/search">
            <button>🔍 搜索文章</button>
          </Link>
        </div>
      )}

      <div>
        {blogList.length === 0 ? (
          <p>暂时还没有文章，点击上方按钮新建第一篇！</p>
        ) : (
          blogList.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid var(--card-border)",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "10px",
                background: "var(--card-bg)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {/* 封面图：有封面才显示 */}
              {item.coverImage ? (
                <Image
                  src={item.coverImage}
                  alt={item.title}
                  width={400}
                  height={150}
                  style={{
                    width: "100%",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                />
              ) : null}

              <Link href={`/blog/${item.id}`}>
              {item.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {item.tags.map((bt) => (
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

              <h2 style={{ margin: 0, color: "var(--link)" }}>{item.pinned ? "📌 " : ""}{item.title}</h2>
              </Link>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  background: "#eef2ff",
                  color: "#4338ca",
                  marginBottom: "8px",
                }}
              >
                {item.category}
              </span>
              <p style={{ color: "var(--text-light)", fontSize: "14px" }}>
                <Link href={`/profile/${item.userId}`} style={{ color: "var(--link)" }}>
                  {item.user?.name || "匿名"}
                </Link>
                发布于 <RelativeTime time={item.createdAt} />
              </p>
            </div>
          ))
        )}
      </div>

      {/* 分页按钮区域 */}
      {totalPage > 1 && (
        <div style={{ display: "flex", gap: "12px", marginTop: "30px", alignItems: "center" }}>
          {currentPage <= 1 ? (
            <button disabled style={{ opacity:0.4,cursor:"not-allowed" }}>上一页</button>
          ) : (
            <Link href={`/blog?category=${currentCategory}&page=${currentPage - 1}`}>
              <button>上一页</button>
            </Link>
          )}

          <span>
            {currentPage} / {totalPage}
          </span>

          {currentPage >= totalPage ? (
            <button disabled style={{ opacity:0.4,cursor:"not-allowed" }}>下一页</button>
          ) : (
            <Link href={`/blog?category=${currentCategory}&page=${currentPage + 1}`}>
              <button>下一页</button>
            </Link>
          )}
        </div>
      )}
    </main>
  );
}