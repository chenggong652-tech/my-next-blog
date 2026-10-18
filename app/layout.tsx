import { auth } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/app/components/Toast";
import ThemeToggle from "@/app/components/ThemeToggle";
import { PlayerProvider } from "@/app/components/PlayerProvider";
// 🧠 第 19 课：迷你条动态导入（首屏不加载它的代码，浏览器空闲时再拉 → 首屏更轻）
// ssr:false 不能直接写在服务端组件里，已包到客户端组件 MiniPlayerLazy
import MiniPlayer from "@/app/components/MiniPlayerLazy";
import { isAdmin } from "@/lib/admin";
import VisitTracker from "@/app/components/VisitTracker";
import InstallButton from "@/app/components/InstallButton";
import ServiceWorkerRegister from "@/app/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "AizyBase - AI 学习与资源分享",
  description: "零基础学 AI：从智能体、Coze 工作流，到 AI 写作绘画，一步步玩转人工智能",
  robots: {
    index: false,   // 不收录本页
    follow: false,  // 不追踪本页链接
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 获取登录状态：登录了是对象，没登录是 null
  const session = await auth();
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      {/* body：背景去"颜色仓库"取货（白天渐变 / 黑夜深色） */}
      <body
        className={inter.className}
        style={{
          background: "var(--bg)",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        {/* 全局导航栏，所有页面顶部都会出现 */}
        <VisitTracker />
        <ServiceWorkerRegister />
        <nav
  className="main-nav p-4 flex gap-6 items-center"

  style={{
    background: "var(--nav-bg)",        // 跟随主题：白天白 / 黑夜深灰
    borderBottom: "1px solid var(--nav-border)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    scrollbarWidth: "thin",    // ④ 滚动条细一点，好看
  }}
>

          <Link href="/" className="text-blue-600">首页</Link>
          <Link href="/about" className="text-blue-600">关于我们</Link>
          <Link href="/users" className="text-blue-600">用户列表</Link>
          <Link href="/blog" className="text-blue-600">博客列表</Link>
          <Link href="/blog-search" className="text-blue-600">博客搜索</Link>
          <Link href="/hot" className="text-blue-600">🔥热门榜单</Link>
          <Link href="/message" className="text-blue-600">留言板</Link>
          <Link href="/tags" className="text-blue-600">🏷️标签</Link>
          <Link href="/music" className="text-blue-600">🎵 音乐馆</Link>
          <Link href="/archive" className="text-blue-600">🗂️归档</Link>

          {/* 右侧：根据登录状态显示 登录 或 退出 */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
            <ThemeToggle />
            {session ? (
              <>
                <InstallButton />
                <Link href="/favorites" className="text-blue-600">❤️收藏</Link>
                {await isAdmin() && (
                  <Link href="/admin" className="text-blue-600">⚙️后台</Link>
                )}
                <Link href="/change-name" className="text-blue-600">👤改昵称</Link>
                <Link href="/change-password" className="text-blue-600">🔑改密码</Link>
                <Link href="/logout" className="text-red-600">🚪退出登录</Link>
              </>
            ) : (
              <Link href="/login" className="text-green-600">🔐去登录</Link>
            )}
          </div>
        </nav>

        {/* 全局播放器（音频+状态，全站共享）+ 全站悬浮迷你条 */}
        <PlayerProvider>
          {/* ToastProvider 包住页面内容：全站都能用右上角弹窗 */}
          <ToastProvider>
            <main style={{ paddingBottom: 72 }}>{children}</main>
          </ToastProvider>
          <MiniPlayer />
        </PlayerProvider>

        {/* 页脚：网站的"信息门牌"（版权/联系/备案） */}
        <footer
          style={{
            borderTop: "1px solid var(--card-border)",
            marginTop: "48px",
            padding: "24px 20px 32px",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          <p style={{ margin: "0 0 8px", color: "var(--text)", fontWeight: 600 }}>
            © 2026 AizyBase · AI 学习与资源分享
          </p>
          <p style={{ margin: "0 0 8px", color: "var(--text-light)" }}>
            联系邮箱：
            <a href="mailto:contact@aizybase.com" style={{ color: "var(--link)" }}>
              contact@aizybase.com
            </a>
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-light)" }}>
            闽ICP备XXXXXXXX号-1（备案后替换）· Powered by Next.js
          </p>
        </footer>
      </body>
    </html>
  );
}
