// sentry.server.config.ts —— 第 E1 课：服务器端错误监控
// 服务器（Node 环境）跑的时候出错（数据库挂了、接口炸了）→ 自动上报 Sentry
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // DSN 从环境变量读（.env.local 里 NEXT_PUBLIC_SENTRY_DSN=你的密钥）
  // 没填 DSN 时 Sentry 自动"静默关闭"，网站照常跑（不会报错）
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
