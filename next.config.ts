import type { NextConfig } from "next";

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

export default nextConfig;
