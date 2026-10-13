"use client";
import { useEffect } from "react";
import { useActionState } from "react";
import { createBlog } from "../actions";
import { useToast } from "@/app/components/Toast";  // ✅导入弹窗工具

// 新建文章表单（客户端组件）：负责显示表单 + 把校验错误提示给用户
export default function NewBlogForm() {
  // useActionState：第一个参数是 Server Action，第二个是初始状态
  // 返回 [当前状态, 表单action]，把错误信息通过 state.error 显示出来
  const [state, formAction] = useActionState(createBlog, {});
  // ✅新增：拿到弹窗功能
  const { showToast } = useToast();
  // 监听器：只要服务器返回错误，右上角立刻弹红色提示
useEffect(() => {
  if (state?.error) {
    showToast(state.error, "err");
  }
}, [state]);
  return (
    <form action={formAction} style={{ display: "grid", gap: "16px" }}>
      <div>
        <label style={{ fontWeight: "bold" }}>文章标题</label>
        <input
          name="title"
          placeholder="输入文章标题（至少2个字）"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "6px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "16px",
          }}
        />
      </div>
      <div>
        <label style={{ fontWeight: "bold" }}>文章分类</label>
        <select
          name="category"
          defaultValue="未分类"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "6px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "16px",
          }}
        >
          <option>未分类</option>
          <option>学习笔记</option>
          <option>生活随笔</option>
          <option>技术教程</option>
        </select>
      </div>
      <div>
        <label style={{ fontWeight: "bold" }}>文章分类</label>
        <select
          name="category"
          defaultValue="未分类"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "6px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "16px",
          }}
        >
          <option>未分类</option>
          <option>学习笔记</option>
          <option>生活随笔</option>
          <option>技术教程</option>
        </select>
      </div>
      <div>
      <label style={{ fontWeight: "bold" }}>文章内容（支持 Markdown：`#`标题、`**`加粗、`-`列表）</label>
        <textarea
          name="content"
          rows={10}
          placeholder="输入文章内容（至少10个字）"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "6px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "16px",
          }}
        />
      </div>

      {/* 校验失败时的红色提示：actions.ts 返回的 error 会显示在这里 */}
      {state?.error && (
        <p
          style={{
            color: "red",
            margin: 0,
            background: "#fef2f2",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        style={{
          width: "fit-content",
          padding: "10px 24px",
          borderRadius: "8px",
          border: "none",
          background: "#2563eb",
          color: "#ffffff",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        提交发布
      </button>
    </form>
  );
}
