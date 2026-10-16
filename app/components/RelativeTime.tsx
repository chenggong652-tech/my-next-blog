"use client";

import { useEffect, useState } from "react";

// 相对时间：把"2026/10/17 00:30"变成"3分钟前/5小时前/3天前"
export default function RelativeTime({ time }: { time: string | Date }) {
  const [text, setText] = useState("");

  useEffect(() => {
    function calc() {
      const t = new Date(time).getTime(); // 发布时刻（毫秒）
      const diff = Date.now() - t; // 新知识：时间差 = 现在 - 发布
      if (diff < 0) return setText("刚刚"); // 时间还没到（服务器时钟偏差）
      const min = Math.floor(diff / 60000); // 毫秒 → 分钟
      if (min < 1) return setText("刚刚");
      if (min < 60) return setText(`${min} 分钟前`);
      const hour = Math.floor(min / 60);
      if (hour < 24) return setText(`${hour} 小时前`);
      const day = Math.floor(hour / 24);
      if (day < 30) return setText(`${day} 天前`);
      return setText(new Date(time).toLocaleDateString()); // 30天以上显示日期
    }
    calc(); // 进来先算一次
    // 新知识：定时器——每隔1分钟自动更新（"3分钟前"会自己变"4分钟前"）
    const timer = setInterval(calc, 60000);
    return () => clearInterval(timer); // 离开页面停掉（防内存泄漏）
  }, [time]);

  return <span>{text}</span>;
}
