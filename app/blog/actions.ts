'use server';
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 创建新文章
export async function createBlog(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) return;

  await prisma.blog.create({
    data: {
      title,
      content,
    },
  });

  // 刷新博客列表页面
  revalidatePath("/blog");
}

// 更新文章
export async function updateBlog(formData: FormData) {
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!id || !title || !content) return;

  const blogItem = await prisma.blog.findUnique({
    where: { id },
  });
  if (!blogItem) return;

  await prisma.blog.update({
    where: { id },
    data: { title, content },
  });
  revalidatePath("/blog");
  revalidatePath(`/blog/${id}`);
}

// 删除文章
export async function deleteBlog(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const blogItem = await prisma.blog.findUnique({
    where: { id },
  });
  if (!blogItem) return;

  await prisma.blog.delete({
    where: { id },
  });
  revalidatePath("/blog");
}
