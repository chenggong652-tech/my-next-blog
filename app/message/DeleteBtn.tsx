// app/message/DeleteBtn.tsx
// 删除按钮（客户端组件：先确认，再删除，弹提示，刷新数据）
"use client";
import { useRouter } from "next/navigation";
import { deleteMessage } from "./actions";
import { useToast } from "@/app/components/Toast";

export default function DeleteBtn({ messageId }: { messageId: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  async function handleDelete() {
    // 先问用户确认
    if (!window.confirm("确定要删除这条留言吗？")) return;

    const formData = new FormData();
    formData.set("msgId", messageId);
    const res = await deleteMessage(formData);

    if (!res.success) {
      showToast(res.msg || "删除失败", "err");
      return;
    }

    showToast("删除成功！", "ok");
    // 延迟刷新数据，让弹窗先显示
    setTimeout(() => {
      router.refresh();
    }, 800);
  }

  return (
    <button
      onClick={handleDelete}
      style={{
        color: "#ef4444",
        fontSize: 13,
        border: "none",
        background: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      删除
    </button>
  );
}
