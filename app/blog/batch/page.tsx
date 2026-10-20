import BatchForm from "./BatchForm";
import Link from "next/link";

export const metadata = { title: "📦 AI 批量导入草稿 | AizyBase" };

export default function BatchPage() {
  return (
    <main style={{ maxWidth: "720px", margin: "40px auto", padding: "0 20px" }}>
      <Link href="/blog" style={{ color: "var(--link)", fontSize: "14px" }}>← 回博客</Link>
      <h1 style={{ margin: "12px 0 6px" }}>📦 AI 批量导入草稿</h1>
      <p style={{ color: "var(--text-light)", fontSize: "14px" }}>
        把 AI 生成的一批文章一次性存进草稿箱，然后去后台逐篇审核发布。
      </p>
      <BatchForm />
    </main>
  );
}
