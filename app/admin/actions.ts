"use server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

// 后台删除文章：只有管理员能用（区别于作者自己删）
export async function adminDeleteBlog(formData: FormData) {
  // 1. 管理员检查（新知识：后台权限）
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };

  // 2. 从"袋子"里拿文章id
  const id = String(formData.get("id") || "");
  if (!id) return { success: false, msg: "参数错误" };

  // 3. 删除（文章被删，它的评论/收藏会跟着删——级联删除）
  await prisma.blog.delete({ where: { id } });

  // 4. 刷新后台和博客列表
  revalidatePath("/admin");
  revalidatePath("/blog");
  return { success: true };
}
