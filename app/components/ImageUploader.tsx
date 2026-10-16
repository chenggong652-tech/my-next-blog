"use client";

import { useRef, useState } from "react";

// 封面图上传：从电脑选图（转成Base64存进表单），也可以粘贴外链
export default function ImageUploader({ initialCover = "" }: { initialCover?: string }) {
  const [cover, setCover] = useState(initialCover); // 当前封面（可能是Base64或外链）
  const [link, setLink] = useState(initialCover.startsWith("data:") ? "" : initialCover); // 外链输入框
  const fileRef = useRef<HTMLInputElement>(null); // 指向隐藏的选图框

  // 选中文件后：读成Base64
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("图片太大！请选 2MB 以内的图片");
      return;
    }
    // 新知识：FileReader 把图片文件读成 Base64 字符串
    const reader = new FileReader();
    reader.onload = () => {
      setCover(String(reader.result));
      setLink(""); // 选了本地图，外链框清空
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      {/* 有封面：显示预览 + 移除按钮 */}
      {cover ? (
        <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={cover}
            alt="封面预览"
            style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--card-border)" }}
          />
          <button
            type="button"
            onClick={() => { setCover(""); setLink(""); if (fileRef.current) fileRef.current.value = ""; }}
            style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 13 }}
          >
            移除
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text)", cursor: "pointer" }}
        >
          🖼️ 从电脑选图片
        </button>
      )}

      {/* 隐藏的选图框：点上面的按钮就打开它 */}
      <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />

      {/* 隐藏的表单字段：图片数据跟着表单一起提交 */}
      <input name="coverImage" value={cover} type="hidden" />

      {/* 也可以粘贴外链 */}
      <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-light)" }}>
        或者粘贴外链：
        <input
          value={link}
          onChange={(e) => { setLink(e.target.value); setCover(e.target.value); }}
          placeholder="https://..."
          style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text)", marginTop: 4, boxSizing: "border-box" }}
        />
      </div>
    </div>
  );
}
