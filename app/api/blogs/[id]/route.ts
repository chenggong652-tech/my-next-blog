// app/api/blogs/[id]/route.ts
// 单篇文章接口：访问 /api/blogs/文章id 拿到这一篇的详细数据
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  // 从网址里取出文章 id（[id] 文件夹 = 网址的这一段会传进来）
  const { id } = await params;

  // 按 id 查这一篇（带正文 content）
  const blog = await prisma.blog.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      coverImage: true,
      views: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  // 没找到：返回"查无此文"+ 404 状态码
  if (!blog) {
    return Response.json({ error: "文章不存在" }, { status: 404 });
  }

  // 找到了：返回这一篇
  return Response.json(blog);
}
