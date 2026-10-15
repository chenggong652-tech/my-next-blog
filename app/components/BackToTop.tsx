"use client";

import { useEffect, useState } from "react";

// 返回顶部按钮：滚过300px后右下角出现，点击平滑回顶
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 监听滚动：滚过300px就显示按钮
    function onScroll() {
      setShow(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll);
    onScroll(); // 进来先算一次
    return () => window.removeEventListener("scroll", onScroll); // 用完摘耳朵
  }, []);

  function goTop() {
    // 平滑滚动回顶部（新知识：scrollTo + smooth）
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 没滚够300px → 什么都不显示
  if (!show) return null;

  return (
    <button
      onClick={goTop}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        border: "1px solid var(--card-border)",
        background: "var(--card-bg)",
        color: "var(--text)",
        fontSize: "18px",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 9999,
      }}
    >
      ↑
    </button>
  );
}
