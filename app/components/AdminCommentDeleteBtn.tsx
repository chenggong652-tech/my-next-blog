"use client";

import { useRouter } from "next/navigation";
import { adminDeleteComment } from "@/app/admin/actions";

// 后台删除评论按钮：管理员专用，删完刷新当前页
export default function AdminCommentDeleteBtn({ commentId }: { commentId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("确定删除这条评论吗？后台删除无法恢复！")) return;
    const formData = new FormData();
    formData.set("id", commentId);
    const res = await adminDeleteComment(formData);
    if (!res.success) {
      alert(res.msg || "删除失败");
      return;
    }
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
