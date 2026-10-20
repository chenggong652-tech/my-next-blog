// lib/ref.ts
// 🅲2 分销返利：推广码工具库（发名片/认亲戚/分钱共用）
// 大白话：每个用户一张"专属名片"，名片上印一串独一无二的码（如 A1B2C3）
// 别人拿着这张名片（点你的推广链接）来买东西 → 钱分你一份

// 生成一个 6 位推广码：去掉容易看错的 0/O/1/I（避免用户复制时搞混）
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function genRefCode(len = 6): string {
  let code = "";
  for (let i = 0; i < len; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

// 保证拿到一个"没被用过"的推广码（撞车就重新生成，最多试 20 次）
export async function uniqueRefCode(prisma: any): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = genRefCode();
    const exists = await prisma.user.findUnique({ where: { refCode: code } });
    if (!exists) return code;
  }
  // 极端情况：20 次都撞车 → 用时间戳兜底（几乎不可能）
  return genRefCode(8) + String(Date.now()).slice(-4);
}

// 从 URL 参数或 Cookie 里解析推广码 → 找到推广员用户（认亲戚）
// 找不到返回 null（不是有效推广码，按自然成交处理）
export async function findReferrer(prisma: any, code: string | null | undefined) {
  if (!code || !/^[A-Z0-9]{4,12}$/.test(code.trim())) return null;
  return prisma.user.findUnique({ where: { refCode: code.trim() } });
}
