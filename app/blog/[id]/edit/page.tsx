import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditBlogForm from "./EditBlogForm";

type Props = {
  params: Promise<{ id: string }>;
};

// 服务端组件：负责登录检查 + 归属检查，再把编辑表单交给客户端组件
export default async function EditBlogPage({ params }: Props) {
  // 未登录就强制跳转到登录页
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const blog = await prisma.blog.findUnique({ where: { id } });

  if (!blog) {
    return (
      <main style={{ maxWidth: "800px", margin: "40px auto" }}>
        <div>文章不存在 <Link href="/blog">返回列表</Link></div>
      </main>
    );
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
      <div
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <h1 style={{ margin: "0 0 24px" }}>编辑文章</h1>
        {/* 把文章原始数据传给表单组件 */}
        <EditBlogForm
  blogId={blog.id}
  blogTitle={blog.title}
  blogContent={blog.content}
  blogCategory={blog.category}
  blogPinned={blog.pinned}
  blogCover={blog.coverImage ?? ""}
/>
      </div>
    </main>
  );
}
