// app/rss.xml/route.ts
// RSS 订阅源：访问 /rss.xml 返回标准 RSS 格式（给阅读器订阅用）
import { prisma } from "@/lib/prisma";

export async function GET() {
  // 取最近 20 篇文章
  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  // 把每篇文章拼成一条 <item>
  const items = blogs
    .map(
      (blog) => `
    <item>
      <title>${blog.title}</title>
      <link>http://localhost:3000/blog/${blog.id}</link>
      <description>${blog.content.slice(0, 200)}</description>
      <pubDate>${blog.createdAt.toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  // 组装成完整的 RSS 文档
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>我的博客</title>
    <link>http://localhost:3000</link>
    <description>我的 Next.js 学习博客</description>
    ${items}
  </channel>
</rss>`;

  // 返回 XML（注意：这次不是 JSON，要告诉浏览器"这是XML"）
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
