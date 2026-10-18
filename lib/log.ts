// lib/log.ts
// 第 22 课：记后台操作日志（谁删了文章/评论都能查）
import { prisma } from "@/lib/prisma";

export async function logAction(action: string, target: string, userName: string) {
  try {
    await prisma.operationLog.create({ data: { action, target, userName } });
  } catch (e) {
    console.error("写日志失败：", e); // 日志失败不影响主操作
  }
}
