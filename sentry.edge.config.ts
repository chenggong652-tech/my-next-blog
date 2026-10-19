// sentry.edge.config.ts —— 第 E1 课：边缘环境错误监控
// 中间件（proxy.ts 那个保安）等边缘环境出错 → 自动上报
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
