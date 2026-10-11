import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main style={{ maxWidth: "400px", margin: "60px auto" }}>
      <h1>登录页面</h1>

      {/* 登录失败时显示错误提示 */}
      {error === "1" && (
        <p style={{ color: "red" }}>邮箱或密码错误，请重新输入</p>
      )}

      <form
        action={async (formData) => {
          "use server";

          // 从表单里取出邮箱和密码
          const email = String(formData.get("email") || "");
          const password = String(formData.get("password") || "");

          try {
            await signIn("credentials", {
              email,
              password,
              redirectTo: "/",
            });
          } catch (error) {
            // 登录失败（邮箱或密码错误）
            if (error instanceof AuthError) {
              redirect("/login?error=1");
            }
            // 登录成功时 signIn 内部会触发重定向，这里把重定向错误继续抛出去
            throw error;
          }
        }}
      >
        <div style={{ margin: "10px 0" }}>
          <label>邮箱</label>
          <input
            name="email"
            type="email"
            style={{ width: "100%", padding: "6px" }}
          />
        </div>
        <div style={{ margin: "10px 0" }}>
          <label>密码</label>
          <input
            name="password"
            type="password"
            style={{ width: "100%", padding: "6px" }}
          />
        </div>
        <button type="submit" style={{ padding: "6px 12px" }}>登录</button>
      </form>

      <p style={{ marginTop: "20px" }}>
        还没有账号？{" "}
        <Link href="/register" style={{ color: "blue" }}>
          去注册
        </Link>
      </p>
    </main>
  );
}
