// sentry.client.config.ts —— 第 E1 课：浏览器端错误监控
// 访客浏览器里报错（页面 JS 崩了）→ 自动上报 Sentry
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
