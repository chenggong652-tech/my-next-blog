import { auth } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
      <body className={inter.className}>
        {/* 全局导航栏，所有页面顶部都会出现 */}
        <nav className="p-4 bg-gray-100 flex gap-6 items-center">
          <Link href="/" className="text-blue-600">首页</Link>
          <Link href="/about" className="text-blue-600">关于我们</Link>
          <Link href="/users" className="text-blue-600">用户列表</Link>
          <Link href="/blog" className="text-blue-600">博客列表</Link>
          <Link href="/blog-search" className="text-blue-600">博客搜索</Link>
          <Link href="/demo-user" className="text-blue-600">练习用户页</Link>
          <Link href="/simple-click" className="text-blue-600">简单点击练习</Link>
          <Link href="/todos-server" className="text-blue-600">服务端待办</Link>
          <Link href="/todos-mix" className="text-blue-600">混合版待办</Link>
          <Link href="/comment" className="text-blue-600">留言板</Link>
          <Link href="/todo" className="text-blue-600">待办列表</Link>
          <Link href="/message" className="text-blue-600">留言板</Link>

          {/* 右侧：根据登录状态显示 登录 或 退出 */}
          <div style={{ marginLeft: "auto" }}>
            {session ? (
              <Link href="/logout" className="text-red-600">🚪退出登录</Link>
            ) : (
              <Link href="/login" className="text-green-600">🔐去登录</Link>
            )}
          </div>
        </nav>
        {/* children 代表每个页面自己的内容，会被塞在这里 */}
        <main>{children}</main>
      </body>
    </html>
  );
}
