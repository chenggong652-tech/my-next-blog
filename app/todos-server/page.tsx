// 服务端组件：不加"use client"
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function TodosServerPage() {
  // 直接在服务器上查询数据库（不经过浏览器）
  const todos = await prisma.todo.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <h1>服务端组件版 - 待办列表</h1>
      <p className="mt-2 text-gray-500">数据在服务器直接读取数据库，不经过浏览器 fetch</p>

      <ul className="mt-4">
        {todos.length === 0 && <li className="text-gray-500">数据库里还没有任务</li>}
        {todos.map((todo) => (
          <li key={todo.id} className="my-2 flex items-center gap-2">
            <span>{todo.finished ? "✅" : "⬜"}</span>
            <span style={{ textDecoration: todo.finished ? "line-through" : "none" }}>
              {todo.content}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
