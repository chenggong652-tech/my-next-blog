"use client";
import { useRouter } from "next/navigation";
import { adminPublishBlog } from "@/app/admin/actions";

export default function AdminPublishBtn({ blogId }: { blogId: string }) {
  const router = useRouter();

  async function handlePublish() {
    if (!window.confirm("确定发布这篇文章吗？发布后所有人都能看到！")) return;
    const formData = new FormData();
    formData.set("id", blogId);
    const res = await adminPublishBlog(formData);
    if (!res.success) { alert(res.msg || "发布失败"); return; }
    router.refresh();
  }

  return (
    <button
      onClick={handlePublish}
      style={{
        padding: "4px 12px",
        borderRadius: "6px",
        border: "1px solid #2563eb",
        background: "#2563eb",
        color: "#fff",
        cursor: "pointer",
        fontSize: "13px",
      }}
    >
      🚀 发布
    </button>
  );
}
