'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

// 添加留言
export async function addMessage(formData: FormData) {
  const name = formData.get('name') as string;
  const content = formData.get('content') as string;
  if (!name || !content) return;

  await prisma.message.create({
    data: { name, content }
  });
  // 刷新留言页面
  revalidatePath('/message');
}

// 删除留言
export async function deleteMessage(formData: FormData) {
  const id = formData.get('msgId') as string;
  if (!id) return;

  // 先查找这条留言
  const targetMsg = await prisma.message.findUnique({
    where: { id }
  });
  // 如果找不到，直接退出，不执行删除，避免报错
  if (!targetMsg) return;

  await prisma.message.delete({
    where: { id }
  });
  // 删除后刷新页面数据
  revalidatePath('/message');
}

// 编辑更新留言
export async function updateMessage(id: string, content: string) {
  if (!id || !content) return;

  const targetMsg = await prisma.message.findUnique({
    where: { id },
  });
  if (!targetMsg) return;

  await prisma.message.update({
    where: { id },
    data: { content },
  });

  revalidatePath("/message");
}
