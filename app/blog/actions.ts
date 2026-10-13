'use server';
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// 表单校验结果类型：成功返回空对象，失败返回错误信息
export type BlogFormState = {
  error?: string;
};

// 创建新文章（必须登录，作者就是当前登录用户）
export async function createBlog(
  prevState: BlogFormState,
  formData: FormData
): Promise<BlogFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "请先登录" };
  }

  const title = (formData.get("title") as string) || "";
  const content = (formData.get("content") as string) || "";
  const category = (formData.get("category") as string) || "未分类";


  // 校验规则（关键教学点）：哪里不对，就把错误信息返回给页面显示
  if (!title.trim()) return { error: "标题不能为空" };
  if (!content.trim()) return { error: "内容不能为空" };
  if (title.trim().length < 2) return { error: "标题至少需要2个字" };
  if (content.trim().length < 10) return { error: "内容至少需要10个字" };

  const blog = await prisma.blog.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      category: category,
      userId: session.user.id, // 记录作者是谁
    },
  });

  revalidatePath("/blog");
  redirect(`/blog/${blog.id}`); // 创建成功 → 跳到新文章页
}

// 更新文章（只能改自己写的）
export async function updateBlog(
  prevState: BlogFormState,
  formData: FormData
): Promise<BlogFormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const id = (formData.get("id") as string) || "";
  const title = (formData.get("title") as string) || "";
  const content = (formData.get("content") as string) || "";
  const category = (formData.get("category") as string) || "未分类";
  const pinned = formData.get("pinned") === "on";

  if (!title.trim()) return { error: "标题不能为空" };
  if (!content.trim()) return { error: "内容不能为空" };
  if (title.trim().length < 2) return { error: "标题至少需要2个字" };
  if (content.trim().length < 10) return { error: "内容至少需要10个字" };

  const blogItem = await prisma.blog.findUnique({
    where: { id },
  });
  if (!blogItem) return { error: "文章不存在" };
  // 关键：只有文章的作者本人才能改
  if (blogItem.userId !== session.user.id) return { error: "无权修改别人的文章" };

  await prisma.blog.update({
    where: { id },
    data: { title: title.trim(), content: content.trim(), category: category, pinned },
  });
  revalidatePath("/blog");
  revalidatePath(`/blog/${id}`);
  redirect(`/blog/${id}`); // 保存成功 → 回到文章页
}

// 删除文章（只能删自己写的）——干完活会把结果告诉客户端
export async function deleteBlog(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, msg: "请先登录" };

  const id = formData.get("id") as string;
  if (!id) return { success: false, msg: "缺少文章编号" };

  const blogItem = await prisma.blog.findUnique({
    where: { id },
  });
  if (!blogItem) return { success: false, msg: "文章不存在" };
  // 关键：只有文章的作者本人才能删
  if (blogItem.userId !== session.user.id) return { success: false, msg: "不能删除别人的文章" };

  await prisma.blog.delete({
    where: { id },
  });
  revalidatePath("/blog");
  return { success: true, msg: "删除成功" };
}
