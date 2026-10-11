'use server';
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

// 创建新文章（必须登录，作者就是当前登录用户）
export async function createBlog(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return; // 未登录，直接退出（页面已控制按钮，这是双保险）

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) return;

  await prisma.blog.create({
    data: {
      title,
      content,
      userId: session.user.id, // 记录作者是谁
    },
  });

  revalidatePath("/blog");
}

// 更新文章（只能改自己写的）
export async function updateBlog(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!id || !title || !content) return;

  const blogItem = await prisma.blog.findUnique({
    where: { id },
  });
  if (!blogItem) return;
  // 关键：只有文章的作者本人才能改
  if (blogItem.userId !== session.user.id) return;

  await prisma.blog.update({
    where: { id },
    data: { title, content },
  });
  revalidatePath("/blog");
  revalidatePath(`/blog/${id}`);
}

// 删除文章（只能删自己写的）
export async function deleteBlog(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const blogItem = await prisma.blog.findUnique({
    where: { id },
  });
  if (!blogItem) return;
  // 关键：只有文章的作者本人才能删
  if (blogItem.userId !== session.user.id) return;

  await prisma.blog.delete({
    where: { id },
  });
  revalidatePath("/blog");
}
