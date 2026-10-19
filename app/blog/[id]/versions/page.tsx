// app/blog/[id]/versions/page.tsx
// 第 D4 课：文章历史版本（看每次保存的"底稿"，能回滚）
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

// 回滚：把某个版本的内容恢复为文章当前内容
async function rollback(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) return;
  const versionId = String(formData.get("versionId") || "");
  const blogId = String(formData.get("blogId") || "");
  if (!versionId || !blogId) return;

  const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!blog) return;
  // 只有作者本人或管理员能回滚
  if (blog.userId !== session.user.id && !(await isAdmin())) return;

  const version = await prisma.articleVersion.findUnique({ where: { id: versionId } });
  if (!version || version.blogId !== blogId) return;

  // 回滚前先把"当前内容"也存一份快照（防止滚错了找不回）
  await prisma.articleVersion.create({
    data: { blogId, title: blog.title, content: blog.content },
  });

  // 把版本内容写回文章
  await prisma.blog.update({
    where: { id: blogId },
    data: { title: version.title, content: version.content },
  });

  revalidatePath(`/blog/${blogId}`);
  revalidatePath(`/blog/${blogId}/versions`);
  redirect(`/blog/${blogId}`);
}

export default async function BlogVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: { versions: { orderBy: { createdAt: "desc" } } },
  });
  if (!blog) {
    return <main style={{ textAlign: "center", padding: 60 }}><p>文章不存在</p></main>;
  }

  // 权限：作者本人或管理员能看/能滚
  const canManage = session?.user?.id === blog.userId || (await isAdmin());

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 60px" }}>
      <h1 style={{ fontSize: 26, textAlign: "center", margin: "8px 0 4px" }}>📜 历史版本</h1>
      <p style={{ textAlign: "center", color: "#666", margin: "0 0 20px" }}>
        《{blog.title}》 ｜ 每次保存都会留底（共 {blog.versions.length} 个版本）
        <Link href={`/blog/${id}`} style={{ display: "block", marginTop: 6, color: "#6366f1", fontSize: 14 }}>← 回文章</Link>
      </p>

      {!canManage ? (
        <p style={{ textAlign: "center", color: "#999", padding: 30 }}>只有作者本人能看历史版本</p>
      ) : blog.versions.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999", padding: 30 }}>还没有历史版本（下次保存文章时自动留底）</p>
      ) : (
        blog.versions.map((v, i) => (
          <div key={v.id} style={{ border: "1px solid #eee", borderRadius: 14, padding: "14px 18px", marginBottom: 12, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong style={{ fontSize: 15 }}>版本 {blog.versions.length - i} ｜ {v.title}</strong>
              <span style={{ fontSize: 12, color: "#999" }}>{v.createdAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</span>
            </div>
            <p style={{ margin: "0 0 10px", color: "#666", fontSize: 13, lineHeight: 1.6, maxHeight: 60, overflow: "hidden" }}>
              {v.content.slice(0, 120)}…
            </p>
            <form action={rollback} style={{ margin: 0 }}>
              <input type="hidden" name="versionId" value={v.id} />
              <input type="hidden" name="blogId" value={blog.id} />
              <button style={{ padding: "6px 14px", borderRadius: 8, background: "#f59e0b", color: "#fff", border: "none", fontSize: 13, cursor: "pointer" }}>
                ↩️ 回滚到这个版本
              </button>
            </form>
          </div>
        ))
      )}
    </main>
  );
}
