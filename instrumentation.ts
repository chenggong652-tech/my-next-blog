// instrumentation.ts —— 第 E1 课：Sentry 开机自启
// Next.js 启动时自动执行：把监控功能"插上电"
export async function register() {
  // 服务器环境启动时 → 加载服务器监控配置
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  // 浏览器环境 → 加载浏览器监控配置
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
