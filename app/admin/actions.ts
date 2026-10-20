"use server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/log";
import { revalidatePath } from "next/cache";

// 后台删除文章：只有管理员能用（区别于作者自己删）
export async function adminDeleteBlog(formData: FormData) {
  // 1. 管理员检查（新知识：后台权限）
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };

  // 2. 从"袋子"里拿文章id
  const id = String(formData.get("id") || "");
  if (!id) return { success: false, msg: "参数错误" };

  // 3. 先记下标题，再删除（删完就查不到了）
  const blog = await prisma.blog.findUnique({ where: { id }, select: { title: true } });
  await prisma.blog.delete({ where: { id } });

  // 记日志：谁在什么时候删了哪篇文章
  const session = await auth();
  if (blog && session?.user?.name) {
    await logAction("删除文章", blog.title, session.user.name);
  }

  // 4. 刷新后台和博客列表
  revalidatePath("/admin");
  revalidatePath("/blog");
  return { success: true };
}
// 后台删除评论：只有管理员能用
export async function adminDeleteComment(formData: FormData) {
  // 1. 管理员检查
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };

  // 2. 从"袋子"里拿评论id
  const id = String(formData.get("id") || "");
  if (!id) return { success: false, msg: "参数错误" };

  // 3. 先记下评论内容（截断30字），再删除
  const comment = await prisma.comment.findUnique({ where: { id }, select: { content: true } });
  await prisma.comment.delete({ where: { id } });

  // 记日志
  const session = await auth();
  if (comment && session?.user?.name) {
    await logAction("删除评论", comment.content.slice(0, 30), session.user.name);
  }

  // 4. 刷新后台
  revalidatePath("/admin");
  return { success: true };
}

// A1 第二站：后台一键发布（草稿 → 发布上线）
export async function adminPublishBlog(formData: FormData) {
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };
  const id = String(formData.get("id") || "");
  if (!id) return { success: false, msg: "参数错误" };

  const blog = await prisma.blog.findUnique({ where: { id }, select: { title: true, status: true } });
  if (!blog) return { success: false, msg: "文章不存在" };
  if (blog.status !== "draft") return { success: false, msg: "只有草稿才能发布" };

  await prisma.blog.update({ where: { id }, data: { status: "published" } });
  const session = await auth();
  if (session?.user?.name) {
    await logAction("发布文章", blog.title, session.user.name);
  }
  revalidatePath("/admin");
  revalidatePath("/blog");
  return { success: true };
}

// 🅲1 后台设置资源促销价（限时折扣）：填活动价+截止时间 = 上活动；点"取消活动" = 恢复原价
export async function setResourceSale(
  _prev: { success?: boolean; msg?: string } | undefined,
  formData: FormData
): Promise<{ success?: boolean; msg?: string }> {
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };

  const id = String(formData.get("id") || "");
  if (!id) return { success: false, msg: "参数错误" };

  const resource = await prisma.resource.findUnique({ where: { id }, select: { title: true, price: true } });
  if (!resource) return { success: false, msg: "资源不存在" };

  // 点了"取消活动"按钮 → 直接恢复原价
  if (formData.get("cancel") === "1") {
    await prisma.resource.update({ where: { id }, data: { discountPrice: null, discountEndAt: null } });
    const session = await auth();
    if (session?.user?.name) await logAction("取消资源促销", resource.title, session.user.name);
    revalidatePath("/admin");
    revalidatePath("/resources");
    return { success: true, msg: `已取消《${resource.title}》的促销，恢复原价` };
  }

  const discountPriceRaw = String(formData.get("discountPrice") || "").trim();
  const discountEndRaw = String(formData.get("discountEndAt") || "").trim();

  // 活动价必须填且是整数（分），例如 490 = 4.9 元
  const discountPrice = Number(discountPriceRaw);
  if (!discountPriceRaw || Number.isNaN(discountPrice) || discountPrice < 0) {
    return { success: false, msg: "活动价要填数字（单位：分，如 490=4.9元）" };
  }
  if (discountPrice >= resource.price) {
    return { success: false, msg: `活动价（${discountPrice}分）必须低于原价（${resource.price}分）才有促销意义` };
  }

  // 截止时间：填了就按填的，留空 = 不限时
  let discountEndAt: Date | null = null;
  if (discountEndRaw) {
    const t = new Date(discountEndRaw);
    if (Number.isNaN(t.getTime())) return { success: false, msg: "截止时间格式不对，要用日期选择器选" };
    discountEndAt = t;
  }

  await prisma.resource.update({
    where: { id },
    data: { discountPrice, discountEndAt },
  });
  const session = await auth();
  if (session?.user?.name) {
    await logAction(
      "设置限时折扣",
      `${resource.title} → ${(discountPrice / 100).toFixed(1)}元${discountEndAt ? "（截止" + discountEndAt.toLocaleString("zh-CN") + "）" : "（不限时）"}`,
      session.user.name
    );
  }
  revalidatePath("/admin");
  revalidatePath("/resources");
  return { success: true, msg: `《${resource.title}》已上活动：¥${(discountPrice / 100).toFixed(1)}` };
}
