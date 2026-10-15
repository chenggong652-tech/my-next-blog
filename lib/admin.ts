import { auth } from "./auth";

// 管理员名单：把"你的登录邮箱"填进来（想加管理员就加一行，逗号隔开）
export const ADMIN_EMAILS = ["chenggong652@gmail.com", "1061202422@qq.com"];

// 判断当前登录的人是不是管理员
export async function isAdmin() {
  const session = await auth();
  return session?.user?.email ? ADMIN_EMAILS.includes(session.user.email) : false;
}
