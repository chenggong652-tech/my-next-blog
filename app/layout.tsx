import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "我的Next学习网站",
  description: "零基础学习Next",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {/* 全局导航栏，所有页面顶部都会出现 */}
        <nav className="p-4 bg-gray-100 flex gap-6">
          <Link href="/" className="text-blue-600">首页</Link>
          <Link href="/about" className="text-blue-600">关于我们</Link>
          <Link href="/users" className="text-blue-600">用户列表</Link>
          <Link href="/blog" className="text-blue-600">博客列表</Link>
          <Link href="/blog-search" className="text-blue-600">博客搜索</Link>   
          <Link href="/demo-user" className="text-blue-600">练习用户页</Link>
          <Link href="/simple-click" className="text-blue-600">简单点击练习</Link>
          <Link href="/todos-server" className="text-blue-600">服务端待办</Link>
          <Link href="/todos-mix" className="text-blue-600">混合版待办</Link>

</nav>
        {/* children 代表每个页面自己的内容，会被塞在这里 */}
        <main>{children}</main>
      </body>
    </html>
  );
}
