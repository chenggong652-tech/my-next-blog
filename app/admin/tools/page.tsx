// app/admin/tools/page.tsx
// 🅵1 工具导航管理：上架新工具 / 下架旧工具（货架管理员）
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import ToolManager from "./ToolManager";

export const metadata = {
  title: "🧰 AI工具管理 | AizyBase",
  robots: { index: false, follow: false },
};

export default async function AdminToolsPage() {
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

  const tools = await prisma.tool.findMany({
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: 28 }}>🧰 AI 工具管理</h1>
      <p style={{ color: "var(--text-light)" }}>管理导航页货架：上架新工具、下架旧工具</p>

      <ToolManager tools={tools} />

      <p style={{ marginTop: 18 }}>
        <Link href="/admin" style={{ color: "var(--link)", fontSize: 14 }}>← 回后台</Link>
        {" | "}
        <Link href="/tools" style={{ color: "var(--link)", fontSize: 14 }}>🧰 看导航页 →</Link>
      </p>
    </main>
  );
}
