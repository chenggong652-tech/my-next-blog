import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  reactStrictMode: false, // 关掉开发模式的严格双挂载（避免音频分析初始化撞车，只影响开发体验）
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**" // 允许所有 https 图片域名（学习项目方便换图床）
      }
    ]
  }
};

// 第 E1 课：用 Sentry 包装配置（构建时自动处理源码映射上传）
// silent: true = 没配 authToken 时安静跳过上传，不阻塞构建
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
