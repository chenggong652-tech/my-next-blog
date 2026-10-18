"use client";
// app/admin/MusicAdmin.tsx
// 后台音乐管理：歌曲列表 + ✏️ 编辑（展开表单）+ 🗑️ 删除

import { useState } from "react";
import { deleteSong, updateSong, toggleSongStatus } from "./music-actions";

type Song = {
  id: string;
  title: string;
  genre: string;
  cover: string | null;
  audioUrl: string;
  lyrics: string | null;
  isOriginal: boolean;
  sortOrder: number;
  status: string;
};

const inputStyle: React.CSSProperties = {
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  width: "100%",
};

export default function MusicAdmin({ songs }: { songs: Song[] }) {
  // 正在编辑哪首歌（null = 没有在编辑）
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = songs.find((s) => s.id === editingId) || null;

  return (
    <div style={{ marginTop: "12px" }}>
      {songs.map((s) => (
        <div key={s.id} style={{ marginTop: "8px" }}>
          {/* 歌曲行 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid var(--card-border)",
              padding: "10px 16px",
              borderRadius: "10px",
              background: "var(--card-bg)",
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>
                🎧 {s.title}{" "}
                <span style={{ fontSize: "12px", color: "var(--text-light)" }}>
                  （{s.genre}）
                </span>{" "}
                {s.status === "published" ? (
                  <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", background: "#dcfce7", color: "#166534" }}>✅ 已上架</span>
                ) : (
                  <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", background: "#fee2e2", color: "#991b1b" }}>🔒 已下架</span>
                )}
              </p>
              <p style={{ margin: "4px 0 0", color: "var(--text-light)", fontSize: "13px" }}>
                {s.audioUrl} · {s.isOriginal ? "✅ AI 原创" : "⚠️ 翻唱"} · 排序 {s.sortOrder}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <form action={toggleSongStatus}>
                <input type="hidden" name="id" value={s.id} />
                <button
                  type="submit"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid #2563eb",
                    background: "transparent",
                    color: "#2563eb",
                    cursor: "pointer",
                  }}
                >
                  {s.status === "published" ? "🔒 下架" : "🚀 上架"}
                </button>
              </form>
              <button
                onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid #f59e0b",
                  background: "transparent",
                  color: "#f59e0b",
                  cursor: "pointer",
                }}
              >
                ✏️ 编辑
              </button>
              <form action={deleteSong}>
                <input type="hidden" name="id" value={s.id} />
                <button
                  type="submit"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid #ef4444",
                    background: "transparent",
                    color: "#ef4444",
                    cursor: "pointer",
                  }}
                >
                  🗑️
                </button>
              </form>
            </div>
          </div>

          {/* 编辑表单：点"编辑"才展开 */}
          {editingId === s.id && editing && (
            <form
              action={updateSong}
              style={{
                border: "1px solid var(--card-border)",
                borderRadius: "12px",
                padding: "16px",
                background: "var(--card-bg)",
                marginTop: "8px",
                display: "grid",
                gap: "10px",
              }}
            >
              <input type="hidden" name="id" value={s.id} />

              <input name="title" defaultValue={editing.title} placeholder="歌名（必填）" required style={inputStyle} />
              <input name="genre" defaultValue={editing.genre} placeholder="风格（如：电子/流行/古风）" style={inputStyle} />
              <input name="cover" defaultValue={editing.cover || ""} placeholder="封面路径（如 /music/covers/snow-tower.webp）" style={inputStyle} />
              <input name="audioUrl" defaultValue={editing.audioUrl} placeholder="音频路径（必填）" required style={inputStyle} />
              <textarea
                name="lyrics"
                defaultValue={editing.lyrics || ""}
                placeholder="歌词（每行一句，空白=清空）"
                rows={5}
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <label style={{ fontSize: "14px", color: "var(--text-light)" }}>
                  <input type="checkbox" name="isOriginal" defaultChecked={editing.isOriginal} /> AI 原创（勾选=可商用；翻唱别勾）
                </label>
                <label style={{ fontSize: "14px", color: "var(--text-light)" }}>
                  排序 <input type="number" name="sortOrder" defaultValue={editing.sortOrder} style={{ width: 70, padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--card-border)" }} />
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg,#f59e0b,#dc2626)",
                    color: "#fff",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  💾 保存修改
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "transparent",
                    color: "var(--text-light)",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </div>
      ))}
      {songs.length === 0 && (
        <p style={{ color: "var(--text-light)", fontSize: "14px" }}>还没有歌，用上面表单发布第一首吧</p>
      )}
    </div>
  );
}
