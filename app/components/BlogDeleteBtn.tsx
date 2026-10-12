"use client";
import { useRouter } from "next/navigation";
import { deleteBlog } from "@/app/blog/actions";
import { useToast } from "@/app/components/Toast";

export default function BlogDeleteBtn({ blogId }: { blogId: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  async function handleDelete() {
    // 1. 先问用户：确定吗？
    if (!window.confirm("确定要删除这篇文章吗？删除后无法恢复！")) return;

    // 2. 把文章id装进"袋子"（和以前表单传参一个意思）
    const formData = new FormData();
    formData.set("id", blogId);

    // 3. 呼叫服务器干活，并等它"回话"
    const res = await deleteBlog(formData);

    // 4. 看回话结果，决定弹什么
    if (!res.success) {
      showToast(res.msg || "删除失败", "err");
      return;
    }
    showToast("文章删除成功！", "ok");
    // 5. 等提示显示一下，再跳回博客列表
    setTimeout(() => {
      router.push("/blog");
    }, 800);
  }

  return (
    <button
      onClick={handleDelete}
      style={{
        padding: "8px 20px",
        borderRadius: "8px",
        border: "1px solid #ef4444",
        background: "#ffffff",
        color: "#ef4444",
        cursor: "pointer",
      }}
    >
      删除文章
    </button>
  );
}