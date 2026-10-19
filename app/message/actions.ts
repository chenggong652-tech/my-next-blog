'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkBadWord } from "@/lib/word-filter";
import { rateLimit } from "@/lib/rate-limit";
import { sendNotifyMail } from "@/lib/mail";    

// 添加留言（必须登录，记录留言者是谁） 
export async function addMessage(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return; // 未登录，直接退出（页面已控制表单，这是双保险）
    // 限流：1分钟最多10次（防机器人狂刷留言）
    const limit = await rateLimit("message");
    if (!limit.ok) return;  

  const name = formData.get('name') as string;
  const content = formData.get('content') as string;
  if (!name || !content) return;
  if ((await checkBadWord(content)) || (await checkBadWord(name))) return; // 含敏感词 → 直接拦截不写入

  await prisma.message.create({
    data: {
      name,
      content,
      userId: session.user.id, // 记录这条留言是谁发的
    },
  });
  revalidatePath('/message');
    // 📧 邮件通知：有人留言了！
    try {
      await sendNotifyMail({
        subject: "💌 AizyBase 新留言提醒",
        text: `有人给你留言啦！\n\n留言者：${name}\n内容：${content}`,
      });
    } catch (e) {
      console.log("邮件发送失败（不影响留言保存）", e);
    }  
}

// 删除留言（只能删自己发的）
export async function deleteMessage(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, msg: "请先登录" };

  const id = formData.get('msgId') as string;
  if (!id) return { success: false, msg: "缺少留言编号" };

  // 先查找这条留言
  const targetMsg = await prisma.message.findUnique({
    where: { id },
  });
  if (!targetMsg) return { success: false, msg: "留言不存在" };

  // 关键：只有留言者本人才能删
  if (targetMsg.userId !== session.user.id) return { success: false, msg: "不能删除别人的留言" };

  await prisma.message.delete({
    where: { id },
  });
  revalidatePath('/message');
  return { success: true, msg: "删除成功" };
}

// 编辑更新留言（只能改自己发的）
export async function updateMessage(id: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  if (!id || !content) return;

  const targetMsg = await prisma.message.findUnique({
    where: { id },
  });
  if (!targetMsg) return;

  // 关键：只有留言者本人才能改
  if (targetMsg.userId !== session.user.id) return;

  await prisma.message.update({
    where: { id },
    data: { content },
  });

  revalidatePath('/message');
}

// 添加回复（必须登录，回复挂在某条留言下面）
export async function addReply(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, msg: "请先登录" };
    // 限流
    const limit = await rateLimit("message");
    if (!limit.ok) return { success: false, msg: limit.msg };  

  const messageId = formData.get("messageId") as string;
  const content = formData.get("content") as string;
  if (!messageId || !content.trim()) return { success: false, msg: "回复内容不能为空" };
  if (await checkBadWord(content)) return { success: false, msg: "回复含敏感词，已被拦截" };

  await prisma.reply.create({
    data: {
      content,
      messageId,
      userId: session.user.id,
    },
  });

  // 📧 邮件通知：有人回复留言了！
  try {
    await sendNotifyMail({
      subject: "💬 AizyBase 新回复提醒",
      text: `有人回复了留言！\n\n回复内容：${content}`,
    });
  } catch (e) {
    console.log("邮件发送失败（不影响回复保存）", e);
  }
  revalidatePath("/message");
  return { success: true, msg: "回复成功" };
}

