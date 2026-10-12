"use client";
import { createContext, useContext, useState } from "react";

type ToastItem = {
  id: number;
  text: string;
  type: "ok" | "err";
};

// 固定模板，小白不用看懂，复制就完事
const ToastCtx = createContext<{
  showToast: (text: string, type: "ok" | "err") => void;
}>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<ToastItem[]>([]);

  const showToast = (text: string, type: "ok" | "err") => {
    const id = Date.now();
    setList((prev) => [...prev, { id, text, type }]);
    // 3秒自动消失
    setTimeout(() => {
      setList((prev) => prev.filter((i) => i.id !== id));
    }, 3000);
  };

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      {/* 弹窗盒子，固定在屏幕右上角 */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display:"flex", flexDirection:"column", gap:8 }}>
        {list.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              color:"white",
              background: item.type === "ok" ? "#22c55e" : "#ef4444",
              boxShadow:"0 2px 10px rgba(0,0,0,0.15)"
            }}
          >
            {item.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// 给页面用的工具函数
export const useToast = () => useContext(ToastCtx);