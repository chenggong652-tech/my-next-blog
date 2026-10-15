// app/change-name/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ChangeNameForm from "./ChangeNameForm";

export default async function ChangeNamePage() {
  // 没登录 → 跳登录
  const session = await auth();
  if (!session) redirect("/login?from=change-name");

  return (
    <main style={{ maxWidth: "420px", margin: "40px auto" }}>
      <h1>修改昵称</h1>
      <p style={{ color: "var(--text-light)", fontSize: 14 }}>
        当前昵称：{session.user?.name || "（未设置）"}
      </p>
      <div
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        {/* 把当前昵称传给表单（预填用） */}
        <ChangeNameForm currentName={session.user?.name ?? ""} />
      </div>
      <Link href="/change-password" style={{ display: "block", marginTop: "16px", color: "var(--link)", fontSize: 14 }}>
        🔑 顺便修改密码 →
      </Link>
      <Link href="/" style={{ display: "block", marginTop: "8px", color: "var(--link)", fontSize: 14 }}>
        ← 返回首页
      </Link>
    </main>
  );
}
