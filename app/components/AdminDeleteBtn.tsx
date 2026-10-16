"use client";

import { useRouter } from "next/navigation";
import { adminDeleteBlog } from "@/app/admin/actions";

// 后台删除按钮：管理员专用，删完刷新当前页
export default function AdminDeleteBtn({ blogId }: { blogId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("确定删除这篇文章吗？后台删除无法恢复！")) return;
    const formData = new FormData();
    formData.set("id", blogId);
    const res = await adminDeleteBlog(formData);
    if (!res.success) {
      alert(res.msg || "删除失败");
      return;
    }
    // 新知识：刷新当前页（列表立即更新，不用跳转）
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      style={{
        padding: "4px 12px",
        borderRadius: "6px",
        border: "1px solid #ef4444",
        background: "transparent",
        color: "#ef4444",
        cursor: "pointer",
        fontSize: "13px",
      }}
    >
      删除
    </button>
  );
}
