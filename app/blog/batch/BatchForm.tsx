"use client";
import { useActionState, useEffect } from "react";
import { createBlogsBatch } from "../actions";

export default function BatchForm() {
  const [state, formAction] = useActionState(createBlogsBatch, {});
  useEffect(() => {
    if (state?.count) alert(`✅ 成功导入 ${state.count} 篇草稿！`);
  }, [state]);

  return (
    <form action={formAction} style={{ display: "grid", gap: "14px" }}>
      <label style={{ fontWeight: "bold" }}>
        批量内容（一行一篇，格式：<code>标题|||内容</code>）
      </label>
      <textarea
        name="batch"
        rows={14}
        placeholder={"第一篇标题|||第一篇正文内容……\n第二篇标题|||第二篇正文内容……"}
        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", fontFamily: "monospace" }}
      />
      <button
        type="submit"
        style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: "16px", width: "fit-content" }}
      >
        📥 全部存为草稿
      </button>
      {state?.error && (
        <p style={{ color: "red", margin: 0, background: "#fef2f2", padding: "10px", borderRadius: "8px" }}>{state.error}</p>
      )}
      {state?.count && (
        <p style={{ color: "#047857", margin: 0, background: "#ecfdf5", padding: "10px", borderRadius: "8px" }}>
          ✅ 成功导入 {state.count} 篇草稿！去后台 /admin 审核发布吧
        </p>
      )}
    </form>
  );
}
