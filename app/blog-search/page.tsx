// app/blog-search/page.tsx —— 第 V1 课：旧搜索页，统一跳转到新搜索页
// （保留入口，防止收藏夹/旧链接 404，只做一件事：redirect）
import { redirect } from "next/navigation";

export default async function OldBlogSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string }>;
}) {
  // 拿到 URL 上的搜索词，原样带给新页面（用户搜索体验不中断）
  const params = await searchParams;
  const q = params.keyword ? `?keyword=${encodeURIComponent(params.keyword)}` : "";
  redirect(`/blog/search${q}`);
}
