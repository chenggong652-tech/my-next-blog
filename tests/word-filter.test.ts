// tests/word-filter.test.ts —— 第 E2 课：自动化测试（测 D3 敏感词功能）
import { describe, it, expect, afterAll } from "vitest";
import { checkBadWord, getBadWords } from "../lib/word-filter";

const TEST_WORD = "测试敏感词xyz";

describe("敏感词过滤（D3 课的功能）", () => {
  // 体检完自动"清场"：删掉测试词，不给数据库留垃圾
  afterAll(async () => {
    const { prisma } = await import("@/lib/prisma");
    const hit = await prisma.badWord.findUnique({ where: { word: TEST_WORD } });
    if (hit) await prisma.badWord.delete({ where: { id: hit.id } });
  });

  it("能从数据库查到敏感词", async () => {
    const { prisma } = await import("@/lib/prisma");
    await prisma.badWord.upsert({ where: { word: TEST_WORD }, update: {}, create: { word: TEST_WORD } });
    const words = await getBadWords();
    expect(words).toContain(TEST_WORD);
  });

  it("文本含敏感词 → 会被抓到", async () => {
    const { prisma } = await import("@/lib/prisma");
    await prisma.badWord.upsert({ where: { word: TEST_WORD }, update: {}, create: { word: TEST_WORD } });
    const result = await checkBadWord(`这句话里有${TEST_WORD}，应该被抓`);
    expect(result).toBe(TEST_WORD);
  });

  it("干净文本 → 放行", async () => {
    const result = await checkBadWord("今天天气不错，适合学习编程");
    expect(result).toBeNull();
  });
});
