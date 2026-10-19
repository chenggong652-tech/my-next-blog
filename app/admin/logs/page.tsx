// app/admin/logs/page.tsx
// 第 22 课收尾：后台操作日志查看页（谁在什么时候删了什么）
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  if (!(await isAdmin())) {
    return (
      <main style={{ maxWidth: 800, margin: "40px auto", textAlign: "center" }}>
        <h1>🔒 无权访问</h1>
        <p style={{ color: "#666" }}>这里只有管理员能进哦</p>
        <Link href="/" style={{ color: "#6366f1" }}>← 回首页</Link>
      </main>
    );
  }

  // 日志倒序（最新的在最上面），最多显示 100 条
  const logs = await prisma.operationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 60px" }}>
      <h1 style={{ fontSize: 28, textAlign: "center", margin: "8px 0 4px" }}>📜 后台操作日志</h1>
      <p style={{ textAlign: "center", color: "#666", margin: "0 0 24px" }}>
        谁在什么时候删了什么，全部有记录
        <Link href="/admin" style={{ display: "block", marginTop: 6, color: "#6366f1", fontSize: 14 }}>← 回后台</Link>
      </p>

      {logs.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>还没有操作记录</p>
      ) : (
        <div style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          {logs.map((log, i) => (
            <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid #f0f0f0", fontSize: 14 }}>
              <span style={{ flex: "0 0 90px", padding: "4px 10px", borderRadius: 999, background: log.action.includes("删除") ? "#fee2e2" : "#e0e7ff", color: log.action.includes("删除") ? "#dc2626" : "#4f46e5", textAlign: "center", fontWeight: 600, fontSize: 12 }}>{log.action}</span>
              <span style={{ flex: 1, color: "#333" }}>{log.target}</span>
              <span style={{ flex: "0 0 120px", color: "#666" }}>👤 {log.userName}</span>
              <span style={{ flex: "0 0 160px", color: "#999", fontSize: 12 }}>{log.createdAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}