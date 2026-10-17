"use client";

import { useEffect, useState } from "react";

// 浏览器发的"可以安装"信号（TS 官方没内置这类型，我们自己定义）
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
}

export default function InstallButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault(); // 拦截默认的地址栏图标
      setInstallEvent(e as BeforeInstallPromptEvent); // 存起来备用
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (installEvent) {
      // 浏览器发了安装信号 → 直接弹系统安装框
      installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    } else {
      // 信号没来（已装过/浏览器限制）→ 提示手动安装
      alert(
        "如果浏览器地址栏右侧有安装图标（⭳），点它就能安装；\n" +
        "或者点浏览器右上角 ⋮ 菜单 → 「安装 AizyBase」"
      );
    }
  };

  return (
    <button
      onClick={handleInstall}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#f59e0b",
        fontSize: "14px",
        fontWeight: 600,
      }}
    >
      📲安装
    </button>
  );
}
