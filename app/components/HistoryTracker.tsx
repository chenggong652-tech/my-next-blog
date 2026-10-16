"use client";

import { useEffect } from "react";

// 浏览历史记录器：打开文章时，把文章记进浏览器小仓库（自己什么都不显示）
export default function HistoryTracker({ blogId, title }: { blogId: string; title: string }) {
  useEffect(() => {
    try {
      // 1. 从仓库拿出旧的浏览记录（可能没有，就用空数组）
      const raw = localStorage.getItem("viewHistory");
      let history: { id: string; title: string }[] = raw ? JSON.parse(raw) : [];

      // 2. 去掉这条文章（可能以前看过，避免重复）
      history = history.filter((h) => h.id !== blogId);

      // 3. 把当前文章放到最前面
      history.unshift({ id: blogId, title });

      // 4. 最多留 10 条（多了就砍掉尾巴）
      if (history.length > 10) history = history.slice(0, 10);

      // 5. 存回仓库
      localStorage.setItem("viewHistory", JSON.stringify(history));
    } catch {
      // 仓库异常时静默失败（不影响页面）
    }
  }, [blogId, title]);

  return null; // 自己什么都不显示
}
