import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewBlogForm from "./NewBlogForm";

export const metadata = {
  title: "新建文章",
};

// 服务端组件：负责登录检查（未登录不让进），再把表单交给客户端组件
export default async function NewBlogPage() {
  // 未登录就强制跳转到登录页，不给看新建表单
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <h1 style={{ margin: "0 0 24px" }}>新建文章</h1>
        <NewBlogForm />
      </div>
    </main>
  );
}
