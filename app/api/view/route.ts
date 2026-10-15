// app/api/view/route.ts
// 阅读量接口：POST 告诉服务器"我看了这篇文章"，服务器判断该不该+1
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // 取出文章id
  const body = await request.json();
  const blogId = body.id as string;
  if (!blogId) return Response.json({ ok: false });

  // 读"看过哪些文章"的小纸条（cookie）：一串文章id，用 | 分隔
  const cookieStore = await cookies();
  const seen = cookieStore.get("seen")?.value || "";
  const seenList = seen ? seen.split("|") : [];

  // 这张纸条里没有这篇 → 才加1，并把id记到纸条上
  if (!seenList.includes(blogId)) {
    await prisma.blog.update({
      where: { id: blogId },
      data: { views: { increment: 1 } },
    });
    seenList.push(blogId);
    // 写回纸条：有效期30天（30天内同一浏览器不再重复计数）
    cookieStore.set("seen", seenList.join("|"), { maxAge: 60 * 60 * 24 * 30 });
  }

  return Response.json({ ok: true });
}
