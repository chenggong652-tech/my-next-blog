"use client";
import { useEffect } from "react";

// 全站访问记录（看不见的组件）：每次打开页面，通知服务器"有人来了"
export default function VisitTracker() {
  useEffect(() => {
    fetch("/api/visit", { method: "POST" }).catch(() => {});
  }, []); // 只在页面加载时触发一次

  return null; // 不显示任何东西
}
