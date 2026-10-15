"use client";
import { useActionState } from "react";
import { changeName } from "./actions";

// 接收当前昵称，用来预填输入框
export default function ChangeNameForm({ currentName }: { currentName: string }) {
  const [state, formAction] = useActionState(changeName, {});

  // 成功：显示成功提示
  if (state?.success) {
    return (
      <div
        style={{
          background: "#ecfdf5",
          border: "1px solid #6ee7b7",
          padding: "16px",
          borderRadius: "10px",
          color: "#065f46",
        }}
      >
        ✅ 昵称修改成功！
      </div>
    );
  }

  return (
    <form action={formAction} style={{ display: "grid", gap: "12px" }}>
      <div>
        <label style={{ fontWeight: "bold" }}>新昵称</label>
        <input
          name="name"
          defaultValue={currentName} // 预填当前昵称（新知识）
          maxLength={20}
          style={{ width: "100%", padding: "10px", marginTop: "6px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px" }}
        />
      </div>

      {state?.error && <p style={{ color: "red", fontSize: 14 }}>{state.error}</p>}

      <button
        type="submit"
        style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: "15px" }}
      >
        保存昵称
      </button>
    </form>
  );
}
