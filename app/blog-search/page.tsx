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
    // 🧠 高亮函数：把关键词标成黄色
  // 先消毒（防XSS）→ 再替换关键词加 <mark> 标签
  function highlight(text: string, keyword: string) {
    if (!keyword) return text; // 没搜索词就不用处理
    // 第1步：消毒——把HTML符号转成安全文本（<script> 变成 &lt;script&gt;，显示出来但不会执行）
    const safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // 第2步：正则特殊字符转义（关键词里有 . * ? 等符号时不报错）
    const kw = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // 第3步：把匹配关键词的地方包上 <mark>（黄色背景）
    return safe.replace(
      new RegExp(kw, "gi"),
      (match) => `<mark style="background:#fef08a;color:#713f12;border-radius:3px;padding:0 2px">${match}</mark>`
    );
  }


  // 查询：标题或内容里包含关键词的文章（模糊查询）
  const results = keyword
    ? await prisma.blog.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { content: { contains: keyword } },
            { category: { contains: keyword } },
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
            background: "var(--card-bg)",
            cursor: "pointer",
          }}
        >
          搜索
        </button>
      </form>

      {/* 没输入关键词时的提示 */}
      {!keyword && <p style={{ color: "var(--text-light)" }}>输入关键词，搜索博客标题或内容</p>}

      {/* 有关键词但没结果 */}
      {keyword && results.length === 0 && (
        <p style={{ color: "var(--text-light)" }}>没有找到包含「{keyword}」的文章</p>
      )}

      {/* 搜索结果列表 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {results.map((blog) => (
          <div
            key={blog.id}
            style={{
              border: "1px solid var(--card-border)",
              padding: 16,
              borderRadius: 10,
              background: "var(--card-bg)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
                        <Link href={`/blog/${blog.id}`}>
              <h3 style={{ margin: 0, color: "var(--link)" }} dangerouslySetInnerHTML={{ __html: highlight(blog.title, keyword) }} />
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
              {blog.category}
            </span>
            <p style={{ fontSize: 13, color: "var(--text-light)", marginTop: 6 }}>
              <Link href={`/profile/${blog.userId}`} style={{ color: "var(--link)" }}>
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
