import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function BlogSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string }>;
}) {
  // Next15：searchParams 是 Promise，必须 await 才能拿到 URL 上的参数
  const params = await searchParams;
  const keyword = params.keyword || "";

  // 查询：标题或内容里包含关键词的文章（模糊查询）
  const results = keyword
    ? await prisma.blog.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { content: { contains: keyword } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: { user: true },
      })
    : [];

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h1>博客搜索</h1>

      {/* 搜索表单：提交后 URL 变成 /blog-search?keyword=xxx */}
      <form action="/blog-search" method="GET" style={{ margin: "20px 0" }}>
        <input
          name="keyword"
          defaultValue={keyword}
          placeholder="输入关键词搜索博客标题或内容"
          style={{
            padding: "8px",
            width: "300px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            marginLeft: 8,
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            background: "#ffffff",
            cursor: "pointer",
          }}
        >
          搜索
        </button>
      </form>

      {/* 没输入关键词时的提示 */}
      {!keyword && <p style={{ color: "#666" }}>输入关键词，搜索博客标题或内容</p>}

      {/* 有关键词但没结果 */}
      {keyword && results.length === 0 && (
        <p style={{ color: "#666" }}>没有找到包含「{keyword}」的文章</p>
      )}

      {/* 搜索结果列表 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {results.map((blog) => (
          <div
            key={blog.id}
            style={{
              border: "1px solid #e5e7eb",
              padding: 16,
              borderRadius: 10,
              background: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Link href={`/blog/${blog.id}`}>
              <h3 style={{ margin: 0, color: "#2563eb" }}>{blog.title}</h3>
            </Link>
            <p style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
              <Link href={`/profile/${blog.userId}`} style={{ color: "#2563eb" }}>
                {blog.user?.name || "匿名"}
              </Link>
              发布于 {blog.createdAt.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
