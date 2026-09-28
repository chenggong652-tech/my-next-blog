"use client";
import { useState } from "react";

export default function Counter() {
  // count 用来保存数字，setCount用来修改数字
  const [count, setCount] = useState(0);
  return (
    <div className="mt-6">
      <p>当前计数：{count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded mt-2"
      >
        点我 +1
      </button>
    </div>
  );
}
