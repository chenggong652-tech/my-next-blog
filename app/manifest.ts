import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AizyBase - AI 学习与资源分享",
    short_name: "AizyBase",
    description: "零基础学 AI：从智能体、Coze 工作流，到 AI 写作绘画",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7ed",
    theme_color: "#f59e0b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
