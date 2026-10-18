// lib/login-guard.ts
// 第 24 课：登录防暴力破解（连续输错5次 → 锁10分钟）
import { headers } from "next/headers";

const FAIL_MAX = 5; // 连续输错 5 次就锁
const LOCK_MS = 10 * 60 * 1000; // 锁 10 分钟

// 草稿纸：记录 谁(IP) → { 输错几次, 锁到几点 }
const store = new Map<string, { fails: number; lockedUntil: number }>();

// 拿到访问者 IP（谁在尝试登录）
export async function getIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// 检查：被锁了没？返回剩余秒数（0 = 没锁）
export function lockRemain(ip: string): number {
  const cur = store.get(ip);
  if (!cur) return 0;
  if (Date.now() > cur.lockedUntil) return 0; // 锁已到期，自动解
  return Math.ceil((cur.lockedUntil - Date.now()) / 1000);
}

// 记一次输错：返回剩余锁定秒数（0 = 还没触发锁）
export function recordFail(ip: string): number {
  const cur = store.get(ip) || { fails: 0, lockedUntil: 0 };
  cur.fails += 1;
  if (cur.fails >= FAIL_MAX) {
    cur.lockedUntil = Date.now() + LOCK_MS; // 触发锁定
    cur.fails = 0;
  }
  store.set(ip, cur);
  return lockRemain(ip);
}

// 登录成功：清零失败记录
export function clearFails(ip: string) {
  store.delete(ip);
}
