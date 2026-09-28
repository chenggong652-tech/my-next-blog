import { PrismaClient } from "@prisma/client";
import TodoActions from "./TodoActions";

const prisma = new PrismaClient();

export default async function TodosMixPage() {
  const todos = await prisma.todo.findMany({
    orderBy:{ createdAt:"desc" }
  })

  return (
    <div className="p-8">
      <h1>混合版：服务端读取数据 + 客户端交互</h1>
      <p className="text-gray-500 mt-2">服务端查询数据库，数据传给客户端组件处理点击</p>
      <TodoActions todoList={todos} />
    </div>
  )
}
