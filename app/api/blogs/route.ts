// app/api/blogs/route.ts
// 这是"文章数据接口"：访问 /api/blogs 就能拿到文章列表（JSON数据）
import { prisma } from "@/lib/prisma";

// GET = 处理"访问"请求（就像浏览器打开网页）
export async function GET() {
  // 从数据库读所有文章，按时间倒序（最新的在前）
  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      coverImage: true,
      views: true,
      createdAt: true,
      user: { select: { name: true } }, // 作者姓名
    },
  });

  // 返回 JSON 数据（Next.js 会自动转成标准 JSON 格式）
  return Response.json(blogs);
}

