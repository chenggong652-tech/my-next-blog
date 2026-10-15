// app/api/export/route.ts
// 数据导出接口：访问 /api/export?type=blogs 下载文章表格（CSV）
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // 网址参数：?type=blogs 表示导出文章
  const type = request.nextUrl.searchParams.get("type") || "blogs";

  // ===== 导出文章列表 =====
  if (type === "blogs") {
    // 读全部文章（带作者和标签）
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, tags: { include: { tag: true } } },
    });

    // 拼 CSV：第一行是表头，后面每行一条文章
    const rows = [
      ["标题", "分类", "标签", "阅读量", "作者", "发布时间"],
      ...blogs.map((b) => [
        b.title,
        b.category,
        b.tags.map((t) => t.tag.name).join("|"), // 多个标签用 | 分隔
        String(b.views),
        b.user?.name || "匿名",
        b.createdAt.toLocaleString(),
      ]),
    ];

    // 每行用逗号连接，行与行用换行连接 → CSV 文本
    const csv = rows.map((r) => r.join(",")).join("\n");

    // \ufeff = BOM（中文不乱码的秘诀）+ attachment = 让浏览器下载
    return new Response("\ufeff" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="blogs.csv"',
      },
    });
  }

  // 其他类型还没做，先返回提示
  return new Response("未知导出类型", { status: 400 });
}
