import { prisma } from "@/lib/prisma";
import { updateBlog } from "../../actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditBlogPage({ params }: Props) {
  // 未登录就强制跳转到登录页，不给看编辑表单
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const blog = await prisma.blog.findUnique({ where: { id } });

  if (!blog) {
    return <div>文章不存在 <Link href="/blog">返回列表</Link></div>;
  }

  // 关键：只能编辑自己写的文章，别人的文章不让进编辑页
  if (session?.user?.id !== blog.userId) {
    return (
      <main style={{ maxWidth: "800px", margin: "40px auto" }}>
        <h1>无权编辑</h1>
        <p>这篇文章不是你写的，不能编辑。</p>
        <Link href={`/blog/${blog.id}`}>← 返回文章</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h1>编辑文章</h1>
      <form action={updateBlog} style={{ display: "grid", gap: "12px" }}>
        <input type="hidden" name="id" value={blog.id} />
        <div>
          <label>文章标题</label>
          <input
            name="title"
            defaultValue={blog.title}
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            required
          />
        </div>
        <div>
          <label>文章内容</label>
          <textarea
            name="content"
            rows={10}
            defaultValue={blog.content}
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            required
          />
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" style={{ padding: "8px 16px" }}>保存修改</button>
          <Link href={`/blog/${blog.id}`}>
            <button type="button" style={{ padding: "8px 16px" }}>取消</button>
          </Link>
        </div>
      </form>
    </main>
  );
}
