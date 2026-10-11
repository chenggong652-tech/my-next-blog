// 服务端组件：不加"use client"
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function TodosServerPage() {
  // 获取当前登录用户（没登录时 session 是 null）
  const session = await auth();

  // 未登录：显示提示，不查数据库
  if (!session?.user?.id) {
    return (
      <div className="p-8">
        <h1>服务端组件版 - 待办列表</h1>
        <p className="mt-4 text-gray-500">
          登录后查看你的待办任务，<Link href="/login" className="text-blue-600">去登录 →</Link>
        </p>
      </div>
    );
  }

  // 直接在服务器上查询当前登录用户的任务
  const todos = await prisma.todo.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <h1>服务端组件版 - 待办列表</h1>
      <p className="mt-2 text-gray-500">数据在服务器直接读取数据库，不经过浏览器 fetch</p>

      <ul className="mt-4">
        {todos.length === 0 && <li className="text-gray-500">还没有任务，去待办列表添加一个吧</li>}
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
