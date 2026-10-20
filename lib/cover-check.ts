// lib/cover-check.ts —— 第 X2 课：封面上传安检员（服务端再锁一道门）
// 大白话：前端选的图片只防君子，防不了小人；攻击者可以绕过前端直接提交请求
// 所以服务端必须自己校验——本文件就是服务端的"安检员"

// 允许的图片类型白名单（MIME）
const ALLOWED_MIMES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

// 图片大小上限：2MB 的图片转成 Base64 文本后约 2.8MB
const MAX_BASE64_LENGTH = 2.8 * 1024 * 1024;

// 校验函数：传原始封面数据，返回 { error } 表示拒绝；返回字符串表示放行
export function sanitizeCover(raw: string): string | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return ""; // 没传封面 = 允许（文章可以没有封面）

  // 情况1：本地上传的图（data:image/xxx;base64,....）
  if (trimmed.startsWith("data:image/")) {
    // 大小检查：超大字符串直接拒（防止坏人塞几十MB把数据库撑爆）
    if (trimmed.length > MAX_BASE64_LENGTH) {
      return { error: "图片太大！服务端限制 2MB 以内" };
    }
    // 类型检查：只认白名单里的 MIME（SVG 会被拒绝——SVG 能夹带脚本）
    const mime = trimmed.slice(5, trimmed.indexOf(";"));
    if (!ALLOWED_MIMES.includes(mime)) {
      return { error: "只允许 PNG/JPG/GIF/WebP 格式的图片" };
    }
    return trimmed;
  }

  // 情况2：粘贴的外链——只放行 http/https，其他协议（javascript: 等）一律拒
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return { error: "封面地址不合法：只支持图片上传或 http/https 链接" };
}
