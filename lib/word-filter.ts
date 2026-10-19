// lib/word-filter.ts
// 第 D3 课：敏感词库管理（词从数据库读，后台可增删）
import { prisma } from "@/lib/prisma";

// 从数据库把全部敏感词拿出来
export async function getBadWords(): Promise<string[]> {
  const rows = await prisma.badWord.findMany({ select: { word: true } });
  return rows.map((r) => r.word);
}

// 检查文本：命中返回敏感词，没命中返回 null
export async function checkBadWord(text: string): Promise<string | null> {
  const words = await getBadWords();
  for (const w of words) {
    if (text.includes(w)) return w;
  }
  return null;
}