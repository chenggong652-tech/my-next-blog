// app/admin/prompts/page.tsx
// 🅵2 提示词管理页：上架/下架（管理员专用）
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import PromptManager from "./PromptManager";

export const metadata = {
  title: "📋 提示词管理 | AizyBase",
  robots: { index: false, follow: false },
};

export default async function AdminPromptsPage() {
  const admin = await isAdmin();
  if (!admin) {
    return (
      <main style={{ maxWidth: "800px", margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "28px" }}>🔒 无权访问</h1>
        <p style={{ color: "var(--text-light)" }}>这里只有管理员能进哦</p>
        <Link href="/" style={{ color: "var(--link)" }}>← 回首页</Link>
      </main>
    );
  }

  const prompts = await prisma.prompt.findMany({
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: 28 }}>📋 提示词管理</h1>
      <p style={{ color: "var(--text-light)" }}>管理提示词货架：上架新模板、下架旧模板</p>
      <PromptManager prompts={prompts} />
      <p style={{ marginTop: 18 }}>
        <Link href="/admin" style={{ color: "var(--link)", fontSize: 14 }}>← 回后台</Link>
        {" | "}
        <Link href="/prompts" style={{ color: "var(--link)", fontSize: 14 }}>📋 看模板库 →</Link>
      </p>
    </main>
  );
}
