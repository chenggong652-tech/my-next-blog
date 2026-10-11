import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 删除单条任务（只能删自己的）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo || todo.userId !== session.user.id) {
    return NextResponse.json({ error: "无权删除别人的任务" }, { status: 403 });
  }

  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// 修改任务（勾选状态 / 修改文字，只能改自己的）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo || todo.userId !== session.user.id) {
    return NextResponse.json({ error: "无权修改别人的任务" }, { status: 403 });
  }

  const updated = await prisma.todo.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(updated);
}
