"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkBadWord } from "@/lib/word-filter";
import { rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

// 提交评论：只有登录用户能评论
export async function addComment(blogId: string, formData: FormData) {
  // 1. 检查登录
  const session = await auth();
  if (!session?.user?.id) return { success: false, msg: "请先登录再评论" };
    // 限流：1分钟最多10次（防机器人狂刷）
    const limit = await rateLimit("comment");
    if (!limit.ok) return { success: false, msg: limit.msg || "" };  

  // 2. 取评论内容（去空格）
  const content = String(formData.get("content") || "").trim();
  if (!content) return { success: false, msg: "评论不能为空" };
  if (content.length > 500) return { success: false, msg: "评论最多500字" };
  const bad = checkBadWord(content);
  if (bad) return { success: false, msg: `评论包含敏感词「${bad}」，已被拦截` };

  // 3. 写进数据库
  await prisma.comment.create({
    data: { content, blogId, userId: session.user.id },
  });

  // 4. 刷新页面（新评论立即出现）
  revalidatePath(`/blog/${blogId}`);
  return { success: true, msg: "评论成功" };
}

// 提交评论回复：只有登录用户能回复
export async function addCommentReply(blogId: string, formData: FormData) {
  // 1. 检查登录
  const session = await auth();
  if (!session?.user?.id) return { success: false, msg: "请先登录再回复" };
    // 限流
    const limit = await rateLimit("comment");
    if (!limit.ok) return { success: false, msg: limit.msg || "" };  

  // 2. 取数据（回复哪条评论 + 回复内容）
  const commentId = String(formData.get("commentId") || "");
  const content = String(formData.get("content") || "").trim();
  if (!commentId) return { success: false, msg: "参数错误" };
  if (!content) return { success: false, msg: "回复内容不能为空" };
  if (content.length > 300) return { success: false, msg: "回复最多300字" };
  const bad = checkBadWord(content);
  if (bad) return { success: false, msg: `回复包含敏感词「${bad}」，已被拦截` };

  // 3. 写进数据库
  await prisma.commentReply.create({
    data: { content, commentId, userId: session.user.id },
  });

  // 4. 刷新页面（新回复立即出现）
  revalidatePath(`/blog/${blogId}`);
  return { success: true, msg: "回复成功" };
}
