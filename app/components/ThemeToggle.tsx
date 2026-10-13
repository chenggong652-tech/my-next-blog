"use client";
import { useEffect, useState } from "react";

// 白天/黑夜切换按钮
export default function ThemeToggle() {
  // 当前是不是黑夜模式
  const [dark, setDark] = useState(false);

  // 打开网站时：先翻浏览器"小本本"，看上次选的是啥
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  // 点击按钮：切换 + 记忆
  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      // 挂上"黑夜"牌子 + 写进小本本
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      // 摘下牌子 + 小本本改成白天
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <button
      onClick={toggle}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: "20px",
        marginRight: "12px",
      }}
      title={dark ? "切换到白天" : "切换到黑夜"}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
