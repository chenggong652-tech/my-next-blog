// lib/rate-limit.ts
// 第 23 课：接口限流（防恶意刷）
import { headers } from "next/headers";

const WINDOW_MS = 60 * 1000; // 时间窗口：1 分钟
const MAX_COUNT = 10; // 1 分钟内最多 10 次

// 进程内记数表（大白话：一张草稿纸，谁来过、来过几次、几点重置）
const store = new Map<string, { count: number; resetAt: number }>();

// 检查是否超限：key = 哪个接口（如 comment），自动按访问者 IP 区分
export async function rateLimit(key: string): Promise<{ ok: boolean; msg?: string }> {
  // 1. 拿到访问者 IP（谁在操作）
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // 2. 在草稿纸上找到这个人的记录
  const fullKey = `${key}:${ip}`;
  const now = Date.now();
  const cur = store.get(fullKey);

  // 3. 第一次来，或窗口过期了 → 重新记（从 1 开始）
  if (!cur || now > cur.resetAt) {
    store.set(fullKey, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  // 4. 次数 +1，超过上限 → 拦截
  cur.count += 1;
  if (cur.count > MAX_COUNT) {
    return { ok: false, msg: "操作太频繁啦，休息一分钟再试 ⏳" };
  }
  return { ok: true };
}
