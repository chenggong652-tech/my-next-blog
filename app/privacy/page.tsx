// app/privacy/page.tsx
// 第 34 课：隐私政策（告诉访客：收集了什么、怎么用、怎么保护）
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "隐私政策 | AizyBase",
};

// 大白话：条款拆成"标题+正文"一条条，页面自动渲染（以后改内容只改这里）
const SECTIONS = [
  {
    title: "一、我们收集哪些信息",
    body: "1. 注册时：你的登录邮箱。\n2. 使用功能时：留言/评论内容、文章收藏、音乐收藏与播放记录、充值余额、购买记录。\n3. 访问统计：网站会记录每天的访问次数（不包含你的具体浏览轨迹）。",
  },
  {
    title: "二、这些信息用来做什么",
    body: "登录你的账号、展示你发布的内容、记录你的购买（用于\"我的下载\"）、计算网站数据看板、发送留言/订单通知邮件。我们不会把你的信息出售给任何第三方。",
  },
  {
    title: "三、信息存储在哪里",
    body: "数据存储在云数据库（Neon PostgreSQL），网站托管在 Vercel。你的密码使用 bcrypt 加密存储，任何人（包括站长）都看不到原文。",
  },
  {
    title: "四、Cookie 与本地存储",
    body: "网站使用浏览器本地存储保存：登录状态、主题偏好（深色/浅色）、迷你播放器的播放状态。这些数据只存在你自己的设备上。",
  },
  {
    title: "五、第三方服务",
    body: "NextAuth（登录认证）、Vercel（网站托管）、Neon（云数据库）、QQ 邮箱服务（发送通知邮件）。这些服务商仅在提供功能所必需的范围内接触数据。",
  },
  {
    title: "六、你的权利",
    body: "你可以随时联系站长查询、更正或删除你的账号及数据；如需注销账号，联系站长处理（当前版本尚未提供自助注销入口）。",
  },
  {
    title: "七、联系我们",
    body: "邮箱：contact@aizybase.com。我们会在收到请求后 3 个工作日内回复。",
  },
  {
    title: "八、政策更新",
    body: "本政策如有更新，会在此页面公示并注明更新日期。继续使用网站即视为同意更新后的政策。",
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 60px" }}>
      <h1 style={{ fontSize: 30, textAlign: "center", margin: "8px 0 6px" }}>🔒 隐私政策</h1>
      <p style={{ textAlign: "center", color: "#888", fontSize: 13, margin: "0 0 28px" }}>
        更新日期：2026-10-20 ｜ AizyBase（aizybase.com）
      </p>

      {SECTIONS.map((s) => (
        <section key={s.title} style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 19, margin: "0 0 8px" }}>{s.title}</h2>
          <p style={{ margin: 0, lineHeight: 1.8, color: "#444", whiteSpace: "pre-line", fontSize: 15 }}>
            {s.body}
          </p>
        </section>
      ))}

      <p style={{ textAlign: "center", marginTop: 32, fontSize: 14 }}>
        <Link href="/" style={{ color: "#6366f1" }}>← 返回首页</Link>
      </p>
    </main>
  );
}