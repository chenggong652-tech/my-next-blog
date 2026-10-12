"use client";
import { useActionState } from "react";
import Link from "next/link";
import { updateBlog } from "../../actions";
import { useEffect } from "react";
import { useToast } from "@/app/components/Toast";  // ✅导入弹窗工具

// 编辑文章表单（客户端组件）
// 通过 props 接收文章原来的数据，显示在输入框里
export default function EditBlogForm({
  blogId,
  blogTitle,
  blogContent,
}: {
  blogId: string;
  blogTitle: string;
  blogContent: string;
}) {
  // 和新建表单一样，用 useActionState 接收校验错误提示（先声明 state）
  const [state, formAction] = useActionState(updateBlog, {});
  // 拿到弹窗工具
  const { showToast } = useToast();
  // 哨兵：服务器一返回错误，右上角立刻弹红色提示（state 声明之后才能用它）
  useEffect(() => {
    if (state?.error) {
      showToast(state.error, "err");
    }
  }, [state]);

  return (
    <form action={formAction} style={{ display: "grid", gap: "16px" }}>
      {/* 隐藏字段：把文章id带过去，服务端才知道改哪一篇 */}
      <input type="hidden" name="id" value={blogId} />
      <div>
        <label style={{ fontWeight: "bold" }}>文章标题</label>
        <input
          name="title"
          defaultValue={blogTitle}
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
        <label style={{ fontWeight: "bold" }}>文章内容</label>
        <textarea
          name="content"
          rows={10}
          defaultValue={blogContent}
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

      {/* 校验失败时的红色提示 */}
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

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          type="submit"
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          保存修改
        </button>
        <Link href={`/blog/${blogId}`}>
          <button
            type="button"
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            取消
          </button>
        </Link>
      </div>
    </form>
  );
}
