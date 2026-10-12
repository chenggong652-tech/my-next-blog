"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 返回结果类型：成功时带 isLike（现在是否处于点赞状态）
type LikeResult =
  | { success: false; msg: string }
  | { success: true; isLike: boolean };

// 点赞或者取消点赞
export async function toggleMessageLike(messageId: string): Promise<LikeResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, msg: "请先登录" };
  }
  const userId = session.user.id;

  // 查询用户是否已经点过这条留言
  const existLike = await prisma.messageLike.findUnique({
    where: {
      userId_messageId: {
        userId,
        messageId,
      },
    },
  });

  if (existLike) {
    // 已经点赞 → 删除记录 = 取消点赞
    await prisma.messageLike.delete({
      where: { id: existLike.id },
    });
    return { success: true, isLike: false };
  } else {
    // 未点赞 → 创建点赞记录
    await prisma.messageLike.create({
      data: {
        userId,
        messageId,
      },
    });
    return { success: true, isLike: true };
  }
}
