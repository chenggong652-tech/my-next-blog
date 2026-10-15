"use client";
import { useActionState } from "react";
import { changePassword } from "./actions";

export default function ChangePasswordForm() {
  // 和留言/文章表单一样的套路：useActionState 接服务器的回话
  const [state, formAction] = useActionState(changePassword, {});

  // 成功：显示成功提示（替换表单）
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
        ✅ 密码修改成功！下次登录请用新密码
      </div>
    );
  }

  return (
    <form action={formAction} style={{ display: "grid", gap: "12px" }}>
      <div>
        <label style={{ fontWeight: "bold" }}>旧密码</label>
        <input
          name="oldPassword"
          type="password"
          required
          style={{ width: "100%", padding: "10px", marginTop: "6px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px" }}
        />
      </div>
      <div>
        <label style={{ fontWeight: "bold" }}>新密码（至少6位）</label>
        <input
          name="newPassword"
          type="password"
          required
          style={{ width: "100%", padding: "10px", marginTop: "6px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px" }}
        />
      </div>
      <div>
        <label style={{ fontWeight: "bold" }}>确认新密码</label>
        <input
          name="confirmPassword"
          type="password"
          required
          style={{ width: "100%", padding: "10px", marginTop: "6px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px" }}
        />
      </div>

      {state?.error && <p style={{ color: "red", fontSize: 14 }}>{state.error}</p>}

      <button
        type="submit"
        style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: "15px" }}
      >
        修改密码
      </button>
    </form>
  );
}
