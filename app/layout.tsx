import { auth } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/app/components/Toast";
import ThemeToggle from "@/app/components/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "我的Next学习网站",
  description: "零基础学习Next",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 获取登录状态：登录了是对象，没登录是 null
  const session = await auth();
  return (
    <html lang="zh-CN">
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
        <nav
          className="p-4 flex gap-6 items-center"
          style={{
            background: "var(--nav-bg)",
            borderBottom: "1px solid var(--nav-border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <Link href="/" className="text-blue-600">首页</Link>
          <Link href="/about" className="text-blue-600">关于我们</Link>
          <Link href="/users" className="text-blue-600">用户列表</Link>
          <Link href="/blog" className="text-blue-600">博客列表</Link>
          <Link href="/blog-search" className="text-blue-600">博客搜索</Link>
          <Link href="/demo-user" className="text-blue-600">练习用户页</Link>
          <Link href="/simple-click" className="text-blue-600">简单点击练习</Link>
          <Link href="/todos-server" className="text-blue-600">服务端待办</Link>
          <Link href="/todos-mix" className="text-blue-600">混合版待办</Link>
          <Link href="/todo" className="text-blue-600">待办列表</Link>
          <Link href="/message" className="text-blue-600">留言板</Link>
          {/* 右侧：根据登录状态显示 登录 或 退出 */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
            <ThemeToggle />
            {session ? (
              <Link href="/logout" className="text-red-600">🚪退出登录</Link>
            ) : (
              <Link href="/login" className="text-green-600">🔐去登录</Link>
            )}
          </div>
        </nav>

        {/* ToastProvider 包住页面内容：全站都能用右上角弹窗 */}
        <ToastProvider>
          <main>{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
