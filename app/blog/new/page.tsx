import { createBlog } from "../actions";
import { auth } from "@/auth/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "新建文章",
};

export default async function NewBlogPage() {
  // 未登录就强制跳转到登录页，不给看新建表单
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h1>新建文章</h1>
      <form action={createBlog} style={{ display: "grid", gap: "12px" }}>
        <div>
          <label>文章标题</label>
          <input
            name="title"
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            required
          />
        </div>
        <div>
          <label>文章内容</label>
          <textarea
            name="content"
            rows={10}
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            required
          />
        </div>
        <button type="submit" style={{ width: "fit-content", padding: "8px 16px" }}>
          提交发布
        </button>
      </form>
    </main>
  );
}
