// vitest.config.ts —— 第 E2 课：体检员的工作配置
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    // 让测试代码里的 @/ 也能找到项目文件（跟网站里一个规矩）
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "node", // 在 Node 环境里体检（不弹浏览器）
  },
});
