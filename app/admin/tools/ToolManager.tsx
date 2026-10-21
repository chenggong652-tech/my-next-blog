// app/admin/tools/ToolManager.tsx
// 🅵1 工具货架管理（客户端）：上架表单 + 下架按钮，操作后整页刷新
"use client";
import { useRouter } from "next/navigation";
import { addTool, deleteTool } from "../actions";

type Tool = {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  icon: string | null;
  featured: boolean;
};

export default function ToolManager({ tools }: { tools: Tool[] }) {
  const router = useRouter();

  // 上架：收集表单内容发给服务端，提示结果后刷新
  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await addTool(fd);
    alert(res.msg || (res.success ? "上架成功" : "上架失败"));
    if (res.success) {
      e.currentTarget.reset();
      router.refresh();
    }
  }

  // 下架：确认后删除，刷新货架
  async function handleDelete(toolId: string, name: string) {
    if (!window.confirm(`确认下架《${name}》？`)) return;
    const fd = new FormData();
    fd.set("toolId", toolId);
    const res = await deleteTool(fd);
    alert(res.msg || (res.success ? "已下架" : "操作失败"));
    router.refresh();
  }

  return (
    <>
      {/* 上架表单 */}
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
        <p style={{ margin: 0, fontWeight: 700 }}>➕ 上架新工具</p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input name="name" placeholder="工具名（如 ChatGPT）" required style={inputStyle} />
          <input
            name="url"
            placeholder="直达链接 https://..."
            required
            style={{ ...inputStyle, flex: 2 }}
          />
        </div>
        <textarea
          name="description"
          placeholder="一句话简介（这工具干嘛的，最多一两句话）"
          required
          style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input name="category" placeholder="分类（如 AI对话 / AI绘画）" style={inputStyle} />
          <input name="icon" placeholder="图标（emoji 或图片网址，可留空）" style={inputStyle} />
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

      {/* 现有货架 */}
      <p style={{ margin: "22px 0 10px", fontWeight: 700 }}>📦 现有工具（{tools.length}）</p>
      <div style={{ display: "grid", gap: "8px" }}>
        {tools.map((t) => (
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
                {t.icon || "🧩"} {t.name}
                {t.featured && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#b45309" }}>⭐ 推荐</span>
                )}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-light)" }}>
                <span style={{ color: "#2563eb" }}>{t.category}</span> ·{" "}
                {t.description.length > 40 ? t.description.slice(0, 40) + "…" : t.description}
              </p>
            </div>
            <button
              onClick={() => handleDelete(t.id, t.name)}
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
        {tools.length === 0 && (
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
