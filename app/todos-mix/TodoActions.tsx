"use client";

import { useState } from "react";

type TodoItem = {
  id: string;
  content: string;
  finished: boolean;
};

export default function TodoActions({ todoList }: { todoList: TodoItem[] }) {
  // 把服务端传过来的数据，作为 useState 的初始值
  const [todos, setTodos] = useState<TodoItem[]>(todoList);

  // 切换完成状态
  const toggle = async (id: string, finished: boolean) => {
    await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finished: !finished }),
    });
    // 修改成功后，只更新本地 state，不刷新页面
    setTodos((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, finished: !finished } : item
      )
    );
  };

  const del = async (id: string) => {
    await fetch(`/api/todos/${id}`, {
      method: "DELETE",
    });
    // 删除成功，把该条从 state 过滤掉
    setTodos((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <ul className="mt-4">
      {todos.length === 0 && <li className="text-gray-500">暂无待办</li>}
      {todos.map((item) => (
        <li key={item.id} className="my-2 flex gap-2 items-center">
          <input
            type="checkbox"
            checked={item.finished}
            onChange={() => toggle(item.id, item.finished)}
          />
          <span
            style={{
              textDecoration: item.finished ? "line-through" : "none",
            }}
          >
            {item.content}
          </span>
          <button
            onClick={() => del(item.id)}
            className="bg-red-500 text-white px-2 rounded"
          >
            删除
          </button>
        </li>
      ))}
    </ul>
  );
}
