"use server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/log";
import { calcLevel } from "@/lib/vip";
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

// 🅲3 订单管理：补登收款（顾客线下转账确认后，手动把订单标成已支付）
// 大白话：顾客说"我转账了"，你确认钱到账 → 点按钮，把订单改成已支付，同时自动完成三件事：
// 给买家记购买资格（能下载了）、给推广员结 20% 佣金、买家累计消费+等级升级（跟正常支付一模一样）
export async function markOrderPaid(formData: FormData) {
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) return { success: false, msg: "参数错误" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { resource: true, user: true },
  });
  if (!order) return { success: false, msg: "订单不存在" };
  if (order.status !== "pending") return { success: false, msg: "只有待支付订单才能补登收款" };

  // 一个事务里完成全部（全部成功才算，绝不半途而废）
  await prisma.$transaction(async (tx) => {
    // 1. 订单 → 已支付
    await tx.order.update({ where: { id: orderId }, data: { status: "paid", paidAt: new Date() } });

    // 2. 记购买资格（没买过才记，防重复）
    const existed = await tx.purchase.findUnique({
      where: { resourceId_userId: { resourceId: order.resourceId, userId: order.userId } },
    });
    if (!existed) {
      await tx.purchase.create({
        data: { resourceId: order.resourceId, userId: order.userId, amount: order.amount },
      });
    }

    // 3. 有推广员 → 结 20% 佣金（补登也算，跟正常支付一样）
    if (order.refUserId) {
      const commission = Math.round((order.amount * 20) / 100);
      if (commission > 0) {
        await tx.user.update({ where: { id: order.refUserId }, data: { commission: { increment: commission } } });
        await tx.commission.create({
          data: {
            userId: order.refUserId,
            orderId: order.id,
            buyerName: order.user?.name || "用户",
            resourceTitle: order.resource.title,
            amount: commission,
          },
        });
      }
    }

    // 4. 买家累计消费 + 等级升级（跟正常购买一致）
    const newTotal = (order.user?.totalSpent || 0) + order.amount;
    await tx.user.update({
      where: { id: order.userId },
      data: { totalSpent: newTotal, level: calcLevel(newTotal) },
    });
  });

  const session = await auth();
  if (session?.user?.name) {
    await logAction(
      "补登收款",
      `《${order.resource.title}》¥${(order.amount / 100).toFixed(1)}`,
      session.user.name
    );
  }
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { success: true, msg: `已确认收款《${order.resource.title}》¥${(order.amount / 100).toFixed(1)}` };
}

// 🅲3 订单管理：退款（顾客要退，钱退回余额，佣金收回，购买资格取消）
// 大白话：顾客要退钱 → 点按钮，四件事一起完成：订单标已退款、钱退回买家余额、
// 收回购买资格（不能再下载）、推广员的佣金扣回（退单了推广费也要还回来）
export async function refundOrder(formData: FormData) {
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) return { success: false, msg: "参数错误" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { resource: true },
  });
  if (!order) return { success: false, msg: "订单不存在" };
  if (order.status !== "paid") return { success: false, msg: "只有已支付的订单才能退款" };

  await prisma.$transaction(async (tx) => {
    // 1. 订单 → 已退款
    await tx.order.update({ where: { id: orderId }, data: { status: "refunded" } });
    // 2. 钱退回买家余额
    await tx.user.update({ where: { id: order.userId }, data: { balance: { increment: order.amount } } });
    // 3. 收回购买资格（退单了就不能再下载）
    await tx.purchase.deleteMany({ where: { resourceId: order.resourceId, userId: order.userId } });
    // 4. 有推广员 → 扣回佣金 + 删掉佣金明细
    if (order.refUserId) {
      const commission = Math.round((order.amount * 20) / 100);
      await tx.user.update({ where: { id: order.refUserId }, data: { commission: { decrement: commission } } });
      await tx.commission.deleteMany({ where: { orderId: order.id } });
    }
  });

  const session = await auth();
  if (session?.user?.name) {
    await logAction(
      "订单退款",
      `《${order.resource.title}》¥${(order.amount / 100).toFixed(1)}`,
      session.user.name
    );
  }
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { success: true, msg: `已退款《${order.resource.title}》¥${(order.amount / 100).toFixed(1)}，钱退回买家余额` };
}

// 🅵1 工具导航：上架新工具（管理员往货架放一张新卡片）
// 大白话：后台填一行"工具名+网址+简介+分类"，点提交 → 导航页立刻多一张卡片
export async function addTool(formData: FormData) {
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };
  const name = String(formData.get("name") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "其他").trim();
  const icon = String(formData.get("icon") || "").trim();
  if (!name || !url || !description) return { success: false, msg: "名字、网址、简介都要填" };
  if (!/^https?:\/\/.+/i.test(url)) return { success: false, msg: "网址要 http/https 开头" };

  await prisma.tool.create({
    data: {
      name,
      url,
      description,
      category: category || "其他",
      icon: icon || null,
      featured: formData.get("featured") === "on",
      sortOrder: Number(formData.get("sortOrder") || 0),
    },
  });

  const session = await auth();
  if (session?.user?.name) await logAction("上架AI工具", `《${name}》（${category}）`, session.user.name);
  revalidatePath("/tools");
  revalidatePath("/admin/tools");
  return { success: true, msg: `已上架《${name}》到 ${category} 分类` };
}

// 🅵1 工具导航：下架工具（把卡片从货架拿走）
export async function deleteTool(formData: FormData) {
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };
  const id = String(formData.get("toolId") || "");
  if (!id) return { success: false, msg: "参数错误" };

  const tool = await prisma.tool.findUnique({ where: { id } });
  if (!tool) return { success: false, msg: "工具不存在" };
  await prisma.tool.delete({ where: { id } });

  const session = await auth();
  if (session?.user?.name) await logAction("下架AI工具", `《${tool.name}》`, session.user.name);
  revalidatePath("/tools");
  revalidatePath("/admin/tools");
  return { success: true, msg: `已下架《${tool.name}》` };
}

// 🅵2 提示词：上架新模板（管理员往货架放一张新卡片）
export async function addPrompt(formData: FormData) {
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };
  const title = String(formData.get("title") || "").trim();
  const prompt = String(formData.get("prompt") || "").trim();
  const category = String(formData.get("category") || "其他").trim();
  if (!title || !prompt) return { success: false, msg: "标题和提示词内容都要填" };

  await prisma.prompt.create({
    data: {
      title,
      prompt,
      category: category || "其他",
      featured: formData.get("featured") === "on",
      sortOrder: Number(formData.get("sortOrder") || 0),
    },
  });

  const session = await auth();
  if (session?.user?.name) await logAction("上架提示词", `《${title}》（${category}）`, session.user.name);
  revalidatePath("/prompts");
  revalidatePath("/admin/prompts");
  return { success: true, msg: `已上架《${title}》到 ${category} 分类` };
}

// 🅵2 提示词：下架模板（把卡片从货架拿走）
export async function deletePrompt(formData: FormData) {
  if (!(await isAdmin())) return { success: false, msg: "没有权限" };
  const id = String(formData.get("promptId") || "");
  if (!id) return { success: false, msg: "参数错误" };

  const p = await prisma.prompt.findUnique({ where: { id } });
  if (!p) return { success: false, msg: "模板不存在" };
  await prisma.prompt.delete({ where: { id } });

  const session = await auth();
  if (session?.user?.name) await logAction("下架提示词", `《${p.title}》`, session.user.name);
  revalidatePath("/prompts");
  revalidatePath("/admin/prompts");
  return { success: true, msg: `已下架《${p.title}》` };
}
