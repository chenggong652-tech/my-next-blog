"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 编辑留言（只能编辑自己发的，内容不能为空）
export async function editMessage(messageId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, msg: "请先登录" };
  }
  if (!content || content.trim() === "") {
    return { success: false, msg: "留言内容不能为空" };
  }

  // 查询这条留言，校验是不是本人的留言
  const targetMsg = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!targetMsg) return { success: false, msg: "留言不存在" };
  if (targetMsg.userId !== session.user.id) {
    return { success: false, msg: "无权编辑别人的留言" };
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { content: content.trim() },
  });
  return { success: true };
}
