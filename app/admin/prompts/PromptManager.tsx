// app/admin/prompts/PromptManager.tsx
// 🅵2 提示词管理（客户端）：上架表单 + 下架按钮
"use client";
import { useRouter } from "next/navigation";
import { addPrompt, deletePrompt } from "../actions";

type Prompt = {
  id: string;
  title: string;
  prompt: string;
  category: string;
  featured: boolean;
};

export default function PromptManager({ prompts }: { prompts: Prompt[] }) {
  const router = useRouter();

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await addPrompt(fd);
    alert(res.msg || (res.success ? "上架成功" : "上架失败"));
    if (res.success) {
      e.currentTarget.reset();
      router.refresh();
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`确认下架《${title}》？`)) return;
    const fd = new FormData();
    fd.set("promptId", id);
    const res = await deletePrompt(fd);
    alert(res.msg || (res.success ? "已下架" : "操作失败"));
    router.refresh();
  }

  return (
    <>
      <form
        onSubmit={handleAdd}
        style={{
          border: "1px solid var(--card-border)",
          borderRadius: 12,
          padding: "18px",
          background: "var(--card-bg)",
          display: "grid",
          gap: "10px",
          marginTop: "16px",
        }}
      >
        <p style={{ margin: 0, fontWeight: 700 }}>➕ 上架新提示词</p>
        <input name="title" placeholder="模板名（如：小红书爆款标题生成器）" required style={inputStyle} />
        <textarea
          name="prompt"
          placeholder="提示词正文（读者点复制就拿走的完整内容）"
          required
          style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input name="category" placeholder="分类（如 写作/绘画/小红书）" style={inputStyle} />
          <input
            name="sortOrder"
            type="number"
            defaultValue={0}
            placeholder="排序号（小=靠前）"
            style={{ ...inputStyle, width: 130 }}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: 13 }}>
          <input name="featured" type="checkbox" />
          ⭐ 设为推荐（摆在最前面）
        </label>
        <button
          type="submit"
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: "#16a34a",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          ✅ 上架
        </button>
      </form>

      <p style={{ margin: "22px 0 10px", fontWeight: 700 }}>📦 现有模板（{prompts.length}）</p>
      <div style={{ display: "grid", gap: "8px" }}>
        {prompts.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              border: "1px solid var(--card-border)",
              borderRadius: 10,
              padding: "10px 14px",
              background: "var(--card-bg)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                📋 {t.title}
                {t.featured && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#b45309" }}>⭐ 推荐</span>
                )}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-light)" }}>
                <span style={{ color: "#f59e0b" }}>{t.category}</span> ·{" "}
                {t.prompt.length > 40 ? t.prompt.slice(0, 40) + "…" : t.prompt}
              </p>
            </div>
            <button
              onClick={() => handleDelete(t.id, t.title)}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "1px solid #dc2626",
                background: "#fff",
                color: "#dc2626",
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              🗑 下架
            </button>
          </div>
        ))}
        {prompts.length === 0 && (
          <p style={{ color: "var(--text-light)", fontSize: 13 }}>货架还是空的，先上架一个吧</p>
        )}
      </div>
    </>
  );
}

const inputStyle = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--card-border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13,
  flex: 1,
  minWidth: 140,
};
