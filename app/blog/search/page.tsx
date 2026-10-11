import { prisma } from "@/lib/prisma";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

type BlogItem = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
};

export default async function BlogSearchPage({ searchParams }: Props) {
  const { q } = await searchParams;

  let blogs: BlogItem[] = [];
  // 如果有搜索关键词，去数据库模糊查找标题匹配的文章
  if (q && q.trim() !== "") {
    blogs = await prisma.blog.findMany({
      where: {
        title: {
          contains: q,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h1>博客搜索</h1>
      {/* 搜索表单，提交后网址带上 ?q=关键词 */}
      <form style={{ marginBottom: "30px", display: "flex", gap: "8px" }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="输入文章标题搜索"
          style={{ flex: 1, padding: "8px" }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>搜索</button>
      </form>

      {q ? (
        <p>关键词：{q}，一共找到 {blogs.length} 篇文章</p>
      ) : (
        <p>请输入关键词搜索文章</p>
      )}

      <div style={{ marginTop: "20px", display: "grid", gap: "12px" }}>
        {blogs.map((item) => (
          <Link
            key={item.id}
            href={`/blog/${item.id}`}
            style={{
              border: "1px solid #ddd",
              padding: "16px",
              borderRadius: "6px",
              textDecoration: "none",
              color: "#222",
            }}
          >
            <h3 style={{ margin: 0 }}>{item.title}</h3>
            <p style={{ color: "#666", fontSize: "14px" }}>
              {item.createdAt.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: "30px" }}>
        <Link href="/blog">← 返回博客列表</Link>
      </div>
    </main>
  );
}
