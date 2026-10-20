import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import bcrypt from "bcryptjs";
import { uniqueRefCode } from "@/lib/ref"; // 🅲2 注册自动发推广码

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main style={{ maxWidth: "400px", margin: "60px auto" }}>
      <h1>注册账号</h1>

      {/* 错误提示 */}
      {error === "1" && (
        <p style={{ color: "red" }}>两次密码不一致，请重新输入</p>
      )}
      {error === "2" && (
        <p style={{ color: "red" }}>这个邮箱已经注册过了，直接去登录</p>
      )}

      <form
        action={async (formData) => {
          "use server";

          // 取出表单内容
          const email = String(formData.get("email") || "").trim();
          const password = String(formData.get("password") || "");
          const confirm = String(formData.get("confirm") || "");

          // 1. 密码一致性校验
          if (password !== confirm) {
            redirect("/register?error=1");
          }

          // 2. 检查邮箱是否已注册
          const existing = await prisma.user.findUnique({
            where: { email },
          });
          if (existing) {
            redirect("/register?error=2");
          }

          // 3. 密码加密（bcrypt 加盐哈希，不存明文）
          const hashedPassword = await bcrypt.hash(password, 12);

          // 4. 创建用户（🎲 自动发一张"推广名片"——唯一的推广码，别人点你的链接进来，你赚佣金）
          const refCode = await uniqueRefCode(prisma);
          await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0], // 默认昵称取邮箱前缀
              password: hashedPassword,
              refCode, // 🅲2 推广码
            },
          });

          // 5. 注册成功，自动登录并跳转首页
          try {
            await signIn("credentials", {
              email,
              password,
              redirectTo: "/",
            });
          } catch (error) {
            if (error instanceof AuthError) {
              redirect("/login?error=1");
            }
            throw error;
          }
        }}
      >
        <div style={{ margin: "10px 0" }}>
          <label>邮箱</label>
          <input
            name="email"
            type="email"
            required
            style={{ width: "100%", padding: "6px" }}
          />
        </div>
        <div style={{ margin: "10px 0" }}>
          <label>密码</label>
          <input
            name="password"
            type="password"
            required
            style={{ width: "100%", padding: "6px" }}
          />
        </div>
        <div style={{ margin: "10px 0" }}>
          <label>确认密码</label>
          <input
            name="confirm"
            type="password"
            required
            style={{ width: "100%", padding: "6px" }}
          />
        </div>
        <button type="submit" style={{ padding: "6px 12px" }}>
          注册并登录
        </button>
      </form>

      <p style={{ marginTop: "20px" }}>
        已有账号？{" "}
        <Link href="/login" style={{ color: "blue" }}>
          去登录
        </Link>
      </p>
    </main>
  );
}
