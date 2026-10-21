// app/prompts/actions.ts
// 🅵2 复制计数：点一次复制，使用次数 +1（热门口碑）
"use server";
import { prisma } from "@/lib/prisma";

export async function incrementPromptUse(id: string) {
  try {
    await prisma.prompt.update({ where: { id }, data: { useCount: { increment: 1 } } });
  } catch {
    // 计数失败不影响复制体验
  }
  return { success: true };
}
