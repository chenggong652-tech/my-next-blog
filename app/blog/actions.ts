'use server';
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/log";
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
  const coverImage = (formData.get("coverImage") as string) || "";
  const tags = formData.getAll("tags") as string[]; // 勾选的多个标签名
  const status = (formData.get("status") as string) || "published";
  const series = (formData.get("series") as string) || "";



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
      coverImage: coverImage.trim(),
      status: status,
      series: series.trim() || null,
      userId: session.user.id, // 记录作者是谁
      // 挂标签：勾选的标签名，数据库没有就自动创建（connectOrCreate）
      tags: {
        create: tags.map((name) => ({
          tag: { connectOrCreate: { where: { name }, create: { name } } },
        })),
      },
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
  const coverImage = (formData.get("coverImage") as string) || "";
  const status = (formData.get("status") as string) || "published";
  const series = (formData.get("series") as string) || "";

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

  // 📸 第 D4 课：保存前先给"旧版本"拍张快照（改坏了能回滚）
  await prisma.articleVersion.create({
    data: { blogId: id, title: blogItem.title, content: blogItem.content },
  });

  await prisma.blog.update({
    where: { id },
        data: { title: title.trim(), content: content.trim(), category: category, pinned, coverImage: coverImage.trim(), status: status , series: series.trim() || null,
        },
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
  // 记日志：谁删了哪篇文章
  if (session?.user?.name) {
    await logAction("删除文章", blogItem.title, session.user.name);
  }
  revalidatePath("/blog");
  return { success: true, msg: "删除成功" };
}
