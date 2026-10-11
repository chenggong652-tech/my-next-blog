import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 获取当前登录用户的任务（每个人只能看到自己的）
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const todos = await prisma.todo.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: 'asc' },
  });
  return Response.json(todos);
}

// 新增任务（必须登录，任务归属当前用户）
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { content } = await req.json();
  const maxOrderTodo = await prisma.todo.findFirst({
    where: { userId: session.user.id },
    orderBy: { sortOrder: 'desc' },
  });
  const newSortOrder = maxOrderTodo ? maxOrderTodo.sortOrder + 1 : 0;
  const newTodo = await prisma.todo.create({
    data: {
      content,
      sortOrder: newSortOrder,
      userId: session.user.id, // 记录这个任务是谁的
    },
  });
  return Response.json(newTodo);
}

// 修改任务（勾选 / 编辑文字，只能改自己的）
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const { id, content, finished } = body;

  // 先确认这个任务属于当前用户
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo || todo.userId !== session.user.id) {
    return Response.json({ error: "无权修改别人的任务" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (content !== undefined) updateData.content = content;
  if (finished !== undefined) updateData.finished = finished;

  const updatedTodo = await prisma.todo.update({
    where: { id },
    data: updateData,
  });
  return Response.json(updatedTodo);
}

// 批量更新拖拽排序（只能排自己的任务）
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const list: { id: string; sortOrder: number }[] = await req.json();
  const ids = list.map(item => item.id);

  // 校验：这些任务必须全部属于当前用户
  const owned = await prisma.todo.findMany({
    where: { id: { in: ids }, userId: session.user.id },
  });
  if (owned.length !== ids.length) {
    return Response.json({ error: "包含无权操作的任务" }, { status: 403 });
  }

  const updatePromises = list.map(item => {
    return prisma.todo.update({
      where: { id: item.id },
      data: { sortOrder: item.sortOrder },
    });
  });
  await Promise.all(updatePromises);
  return Response.json({ ok: true });
}

// 删除任务（只能删自己的）
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await req.json();
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo || todo.userId !== session.user.id) {
    return Response.json({ error: "无权删除别人的任务" }, { status: 403 });
  }

  await prisma.todo.delete({ where: { id } });
  return Response.json({ ok: true });
}
