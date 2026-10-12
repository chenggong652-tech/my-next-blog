"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { editMessage } from "@/app/actions/messageEditAction";
// ✅导入弹窗工具
import { useToast } from "@/app/components/Toast";

type Props = {
  messageId: string;
  oldContent: string;
};

export default function MessageEditBtn({ messageId, oldContent }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(oldContent);
  const [errMsg, setErrMsg] = useState("");
  // ✅新增：拿到弹窗功能
  const { showToast } = useToast();
  // ✅新增：路由刷新工具（只刷新数据，不整页刷新）
  const router = useRouter();

  const handleSubmit = async () => {
    setErrMsg("");
    const res = await editMessage(messageId, content);
    if (!res.success) {
      setErrMsg(res.msg || "修改失败");
      // ✅失败：弹出红色提示
      showToast(res.msg || "修改失败", "err");
      return;
    }
    // ✅成功：弹出绿色提示
    showToast("留言修改成功！", "ok");
    setOpen(false);
    // 先让弹窗显示出来，延迟0.8秒后再刷新数据（这样弹窗不会被刷新清掉）
    setTimeout(() => {
      router.refresh();
    }, 800);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          fontSize: "12px",
          color: "#2563eb",
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
      >
        编辑
      </button>
      {open && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999
        }}>
          <div style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            width: "420px"
          }}>
            <h3>编辑留言</h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: "100%",
                height: "100px",
                padding: "8px",
                borderRadius: "6px"
              }}
            />
            {errMsg && <p style={{ color: "red", fontSize: 12 }}>{errMsg}</p>}
            <div style={{ marginTop: 12, display: "flex", gap: "10px" }}>
              <button onClick={handleSubmit}>保存</button>
              <button onClick={() => setOpen(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}