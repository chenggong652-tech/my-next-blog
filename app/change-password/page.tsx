// app/change-password/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function ChangePasswordPage() {
  // 没登录 → 踢到登录页（你学的中间件理念，这里是页面级检查）
  const session = await auth();
  if (!session) redirect("/login?from=change-password");

  return (
    <main style={{ maxWidth: "420px", margin: "40px auto" }}>
      <h1>修改密码</h1>
      <p style={{ color: "var(--text-light)", fontSize: 14 }}>
        登录账号：{session.user?.email}
      </p>
      <div
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <ChangePasswordForm />
      </div>
      <Link href="/" style={{ display: "block", marginTop: "16px", color: "var(--link)", fontSize: 14 }}>
        ← 返回首页
      </Link>
    </main>
  );
}
