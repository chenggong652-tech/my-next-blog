import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import TodoActions from "./TodoActions";
import Link from "next/link";

export default async function TodosMixPage() {
  // 获取当前登录用户
  const session = await auth();

  // 未登录：显示提示
  if (!session?.user?.id) {
    return (
      <div className="p-8">
        <h1>混合版：服务端读取数据 + 客户端交互</h1>
        <p className="text-gray-500 mt-4">
          登录后查看你的待办任务，<Link href="/login" className="text-blue-600">去登录 →</Link>
        </p>
      </div>
    );
  }

  // 只查询当前登录用户的任务
  const todos = await prisma.todo.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <h1>混合版：服务端读取数据 + 客户端交互</h1>
      <p className="text-gray-500 mt-2">服务端查询数据库，数据传给客户端组件处理点击</p>
      <TodoActions todoList={todos} />
    </div>
  );
}
