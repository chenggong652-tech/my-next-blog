import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
