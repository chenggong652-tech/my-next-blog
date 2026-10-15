"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// 提交评论：只有登录用户能评论
export async function addComment(blogId: string, formData: FormData) {
  // 1. 检查登录
  const session = await auth();
  if (!session?.user?.id) return { success: false, msg: "请先登录再评论" };

  // 2. 取评论内容（去空格）
  const content = String(formData.get("content") || "").trim();
  if (!content) return { success: false, msg: "评论不能为空" };
  if (content.length > 500) return { success: false, msg: "评论最多500字" };

  // 3. 写进数据库
  await prisma.comment.create({
    data: { content, blogId, userId: session.user.id },
  });

  // 4. 刷新页面（新评论立即出现）
  revalidatePath(`/blog/${blogId}`);
  return { success: true, msg: "评论成功" };
}
