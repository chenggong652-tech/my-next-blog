// app/sitemap.ts
// 站点地图：给搜索引擎的"目录清单"，自动生成 /sitemap.xml
import { prisma } from "@/lib/prisma";

export default async function sitemap() {

  // 读环境变量：线上是正式域名，本地没配就用 localhost（兜底）
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // 读所有文章的 id 和更新时间（生成每篇文章的地址）
  const blogs = await prisma.blog.findMany({
    select: { id: true, updatedAt: true },
  });

  return [
    // 固定页面：首页、博客列表
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/blog`, lastModified: new Date() },
    // 每篇文章一个地址（... = 把数组"展开"塞进来，你学过的展开语法）
    ...blogs.map((blog) => ({
      url: `${siteUrl}/blog/${blog.id}`,
      lastModified: blog.updatedAt,
    })),
  ];
}
