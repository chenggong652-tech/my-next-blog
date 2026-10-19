// proxy.ts —— 第 D1 课：防爬虫门卫（网站入口放哨）
// 位置：必须在项目根目录（my-app 下）；Next.js 16 新约定用 proxy.ts（旧名 middleware.ts 已废弃）
import { NextRequest, NextResponse } from "next/server";

// 黑名单：专偷内容的"搬运工"爬虫（名字全是它自己报的 UA）
const BAD_BOTS = [
  "ahrefsbot", "semrushbot", "mj12bot", "dotbot", "petalbot",
  "bytespider", "gptbot", "ccbot", "amazonbot", "claudebot",
  "dataforseobot", "yandexbot",
];

export function proxy(req: NextRequest) {
  const url = req.nextUrl.pathname; // 访问的哪个地址
  const ua = (req.headers.get("user-agent") || "").toLowerCase(); // 来访者自报家门

  // 动作 1：认出黑名单爬虫 → 直接拒之门外（403 = 禁止进入）
  for (const bot of BAD_BOTS) {
    if (ua.includes(bot)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 动作 2：保护后台——不是浏览器（空UA/程序UA）想进 /admin → 拦
  if (
    url.startsWith("/admin") &&
    (!ua || ua.includes("python") || ua.includes("curl") || ua.includes("go-http"))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

    // 动作 3：防盗链——本地图片只许自己网站显示（别人网站引用 → 403）
    const isImage =
    url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".jpeg") || url.endsWith(".webp");
  if (isImage) {
    const referer = req.headers.get("referer") || ""; // "你从哪个门进来的"
    // 有来路 + 不是自己网站 → 白嫖，拦！
    if (referer && !referer.includes("localhost:3000") && !referer.includes("aizybase.com")) {
      return NextResponse.json({ error: "Hotlink denied" }, { status: 403 });
    }
    // 没来路（直接打开图片/手机看图）→ 放行（不误伤好人）
  }
  
  // 动作 3：其他都正常放行
  return NextResponse.next();
}

// 保安站岗的位置：图片/字体/图标/地图等"公用设施"不拦，其余全部过闸
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|sitemap.xml|rss.xml|robots.txt).*)",
  ],
};
