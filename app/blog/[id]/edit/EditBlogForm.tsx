"use client";
import { useActionState } from "react";
import Link from "next/link";
import { updateBlog } from "../../actions";
import { useEffect } from "react";
import { useToast } from "@/app/components/Toast";  // ✅导入弹窗工具
import ImageUploader from "@/app/components/ImageUploader";

// 编辑文章表单（客户端组件）
// 通过 props 接收文章原来的数据，显示在输入框里
export default function EditBlogForm({
  blogId,
  blogTitle,
  blogContent,
  blogCategory,
  blogPinned,
  blogCover,
  blogSeries,
  blogSeoTitle,
  blogSeoDescription,
  blogKeywords,
}: {
  blogId: string;
  blogTitle: string;
  blogContent: string;
  blogCategory: string;
  blogPinned: boolean;
  blogCover: string;
  blogSeries: string;
  blogSeoTitle: string;
  blogSeoDescription: string;
  blogKeywords: string;
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
      <label style={{ fontWeight: "bold" }}>封面图（可选，从电脑选或粘贴外链）</label>
        <div style={{ marginTop: 6 }}>
          <ImageUploader initialCover={blogCover} />
        </div>
      </div>
      <div>
        <label style={{ fontWeight: "bold" }}>文章分类</label>
        <select
          name="category"
          defaultValue={blogCategory}
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
        
        <div>
          <label style={{ fontWeight: "bold" }}>所属系列（可选）</label>
          <input
            name="series"
            defaultValue={blogSeries}
            placeholder="填了就能把文章归进一个系列，读者可以追更"
            style={{ width: "100%", padding: "10px", marginTop: "6px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px" }}
          />
        </div>

        {/* 🅰️ A2：SEO 身份证（编辑时也能补/改） */}
        <div>
          <label style={{ fontWeight: "bold" }}>🔍 SEO 标题（可选，给搜索引擎看的加长版标题）</label>
          <input
            name="seoTitle"
            defaultValue={blogSeoTitle}
            placeholder="如：零基础用 AI 建站｜从 0 到能收钱的网站（全流程）"
            style={{ width: "100%", padding: "10px", marginTop: "6px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px" }}
          />
        </div>
        <div>
          <label style={{ fontWeight: "bold" }}>📝 SEO 简介（可选，一句话说清这篇讲啥）</label>
          <textarea
            name="seoDescription"
            rows={2}
            defaultValue={blogSeoDescription}
            placeholder="如：不用懂代码，跟着一步步把 AI 网站搭起来并接上收款"
            style={{ width: "100%", padding: "10px", marginTop: "6px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px" }}
          />
        </div>
        <div>
          <label style={{ fontWeight: "bold" }}>🎯 关键词（可选，逗号分隔，如：AI建站,零基础,Next.js）</label>
          <input
            name="keywords"
            defaultValue={blogKeywords}
            placeholder="写 2-3 个词，逗号隔开"
            style={{ width: "100%", padding: "10px", marginTop: "6px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px" }}
          />
        </div>

        <div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: "bold" }}>
          <input type="checkbox" name="pinned" defaultChecked={blogPinned} />
          置顶这篇文章（列表最前面）
        </label>
      </div>
      </div>
      <div>
      <label style={{ fontWeight: "bold" }}>文章内容（支持 Markdown：`#`标题、`**`加粗、`-`列表）</label>
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
          type="submit" name="status" value="draft"
          style={{ padding: "10px 24px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#ffffff", cursor: "pointer", fontSize: "16px" }}
        >
          💾 存为草稿
        </button>
        <button
          type="submit" name="status" value="published"
          style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", cursor: "pointer", fontSize: "16px" }}
        >
          🚀 立即发布
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
