import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 获取全部任务，按sortOrder从小到大排序（数字越小越靠上）
export async function GET() {
  const todos = await prisma.todo.findMany({
    orderBy: {
      sortOrder: 'asc'
    }
  });
  return Response.json(todos);
}

// 新增任务，自动取最大序号+1（新任务排在最后）
export async function POST(req: Request) {
  const { content } = await req.json();
  const maxOrderTodo = await prisma.todo.findFirst({
    orderBy: { sortOrder: 'desc' }
  });
  const newSortOrder = maxOrderTodo ? maxOrderTodo.sortOrder + 1 : 0;
  const newTodo = await prisma.todo.create({
    data: {
      content,
      sortOrder: newSortOrder
    }
  });
  return Response.json(newTodo);
}

// 修改任务（勾选 / 编辑文字）
export async function PUT(req: Request) {
  const body = await req.json();
  const { id, content, finished } = body;
  const updateData: Record<string, unknown> = {};
  if (content !== undefined) updateData.content = content;
  if (finished !== undefined) updateData.finished = finished;

  const updatedTodo = await prisma.todo.update({
    where: { id },
    data: updateData
  });
  return Response.json(updatedTodo);
}

// 批量更新拖拽排序
export async function PATCH(req: Request) {
  const list: { id: string; sortOrder: number }[] = await req.json();
  // 逐条把新的排序数字写进数据库
  const updatePromises = list.map(item => {
    return prisma.todo.update({
      where: { id: item.id },
      data: { sortOrder: item.sortOrder }
    });
  });
  await Promise.all(updatePromises);
  return Response.json({ ok: true });
}

// 删除任务
export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.todo.delete({
    where: { id }
  });
  return Response.json({ ok: true });
}
