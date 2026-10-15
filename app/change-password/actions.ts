'use server';
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// 表单结果类型：错误信息 or 成功标记
export type ChangePasswordState = { error?: string; success?: boolean };

// 修改密码动作（服务器执行）
export async function changePassword(
  prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  // 1. 必须登录
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  // 2. 拿表单里的三个值
  const oldPassword = (formData.get("oldPassword") as string) || "";
  const newPassword = (formData.get("newPassword") as string) || "";
  const confirmPassword = (formData.get("confirmPassword") as string) || "";

  // 3. 校验（服务器说了算）
  if (!oldPassword) return { error: "请输入旧密码" };
  if (newPassword.length < 6) return { error: "新密码至少需要6位" };
  if (newPassword !== confirmPassword) return { error: "两次输入的新密码不一致" };

  // 4. 查出当前用户
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.password) return { error: "账号异常，无法修改密码" };

  // 5. 验证旧密码（对暗号）
  const oldOk = await bcrypt.compare(oldPassword, user.password);
  if (!oldOk) return { error: "旧密码不正确" };

  // 6. 新密码加密后存进去
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  return { success: true };
}
