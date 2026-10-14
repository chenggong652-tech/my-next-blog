// middleware.ts —— 网站保安
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// 每个请求进来，保安先检查（只有"巡逻范围"内的请求才会经过这里）
export default auth((req) => {
  const isLoggedIn = !!req.auth; // 有登录信息 = 已登录
  const url = req.nextUrl; // 这次请求的网址

  // 判断是不是"重点房间"：
  // 1) 新建文章页 /blog/new
  // 2) 编辑文章页 /blog/xxx/edit（结尾是 /edit）
  const isProtected =
    url.pathname === "/blog/new" || url.pathname.endsWith("/edit");

  // 没登录 + 想进重点房间 → 拦下，跳到登录页
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login?from=need-login", url));
  }

  // 其他情况：什么都不返回 = 放行
});

// 保安巡逻范围：只查 /blog 开头的地址（其他页面不管，省力）
export const config = {
  matcher: ["/blog/:path*"],
};
