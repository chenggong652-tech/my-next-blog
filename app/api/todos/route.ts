import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 获取全部任务（最新的排前面）
export async function GET() {
  const todos = await prisma.todo.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(todos);
}

// 新增任务
export async function POST(req: Request) {
  const body = await req.json();
  const todo = await prisma.todo.create({
    data: { content: body.content },
  });
  return NextResponse.json(todo);
}
