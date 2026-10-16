"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// 浏览历史显示：首页展示"最近看过"的文章
export default function ViewHistory() {
  const [history, setHistory] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("viewHistory");
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // 读失败就当没有历史
    }
  }, []);

  // 没记录就不显示这一块
  if (history.length === 0) return null;

  return (
    <div style={{ marginTop: "30px" }}>
      <h2 style={{ fontSize: "20px" }}>🕘 最近看过</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
        {history.map((h) => (
          <Link
            key={h.id}
            href={`/blog/${h.id}`}
            style={{
              padding: "8px 14px",
              borderRadius: "20px",
              border: "1px solid var(--card-border)",
              background: "var(--card-bg)",
              color: "var(--link)",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            {h.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
