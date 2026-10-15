'use server';
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 表单结果类型
export type ChangeNameState = { error?: string; success?: boolean };

// 修改昵称动作（服务器执行）
export async function changeName(
  prevState: ChangeNameState,
  formData: FormData
): Promise<ChangeNameState> {
  // 1. 必须登录
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  // 2. 拿昵称（去掉首尾空格）
  const name = ((formData.get("name") as string) || "").trim();

  // 3. 校验
  if (!name) return { error: "昵称不能为空" };
  if (name.length > 20) return { error: "昵称最多20个字" };

  // 4. 更新自己这行的昵称
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  return { success: true };
}
