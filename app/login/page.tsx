import { signIn } from "@/lib/auth";
import { CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getIp, lockRemain, recordFail, clearFails } from "@/lib/login-guard";

type Props = {
  searchParams: Promise<{ error?: string; lock?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error, lock } = await searchParams;


  return (
    <main style={{ maxWidth: "400px", margin: "60px auto" }}>
      <h1>登录页面</h1>

      {/* 登录失败时显示错误提示 */}
      {error === "1" && (
        <p style={{ color: "red" }}>邮箱或密码错误，请重新输入</p>
      )}
      {error === "2" && (
        <p style={{ color: "red" }}>
          尝试次数过多，已锁定 {lock || "10"} 秒，请稍后再试 🔒
        </p>
      )}

      <form
        action={async (formData) => {
          "use server";

          // 从表单里取出邮箱和密码
          const email = String(formData.get("email") || "");
          const password = String(formData.get("password") || "");

          // 🔒 防暴力破解：先查这个IP锁没锁
          const ip = await getIp();
          const remain = lockRemain(ip);
          if (remain > 0) {
            redirect(`/login?error=2&lock=${remain}`);
          }

          // 登录（redirect:false = 不自动跳转，让我们自己判断成败）
          try {
            await signIn("credentials", {
              email,
              password,
              redirect: false,
            });
          } catch (e) {
            // 🔑 关键：密码错误时 Auth.js 会"抛异常"（CredentialsSignin）而不是返回结果
            // 所以要在 catch 里接住它：记一次输错 + 判断要不要锁
            if (e instanceof CredentialsSignin) {
              const lockSec = recordFail(ip);
              if (lockSec > 0) {
                redirect(`/login?error=2&lock=${lockSec}`);
              }
              redirect("/login?error=1");
            }
            throw e; // 其他异常（比如网络问题）原样抛出
          }

          // 登录成功：清零失败记录 + 回首页
          clearFails(ip);
          redirect("/");
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
