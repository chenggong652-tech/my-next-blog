"use server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/log";
import { revalidatePath } from "next/cache";

// 后台删除文章：只有管理员能用（区别于作者自己删）
export async function adminDeleteBlog(formData: FormData) {
  // 1. 管理员检查（新知识：后台权限）
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };

  // 2. 从"袋子"里拿文章id
  const id = String(formData.get("id") || "");
  if (!id) return { success: false, msg: "参数错误" };

  // 3. 先记下标题，再删除（删完就查不到了）
  const blog = await prisma.blog.findUnique({ where: { id }, select: { title: true } });
  await prisma.blog.delete({ where: { id } });

  // 记日志：谁在什么时候删了哪篇文章
  const session = await auth();
  if (blog && session?.user?.name) {
    await logAction("删除文章", blog.title, session.user.name);
  }

  // 4. 刷新后台和博客列表
  revalidatePath("/admin");
  revalidatePath("/blog");
  return { success: true };
}
// 后台删除评论：只有管理员能用
export async function adminDeleteComment(formData: FormData) {
  // 1. 管理员检查
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };

  // 2. 从"袋子"里拿评论id
  const id = String(formData.get("id") || "");
  if (!id) return { success: false, msg: "参数错误" };

  // 3. 先记下评论内容（截断30字），再删除
  const comment = await prisma.comment.findUnique({ where: { id }, select: { content: true } });
  await prisma.comment.delete({ where: { id } });

  // 记日志
  const session = await auth();
  if (comment && session?.user?.name) {
    await logAction("删除评论", comment.content.slice(0, 30), session.user.name);
  }

  // 4. 刷新后台
  revalidatePath("/admin");
  return { success: true };
}
