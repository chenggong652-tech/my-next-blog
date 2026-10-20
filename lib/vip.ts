// lib/vip.ts
// 第 33 课：会员等级计算器（升级规则都在这，改规则只改这一处）
// 大白话：累计消费（分）→ 算等级
//   ¥50 → Lv2    ¥100 → Lv3    ¥200 → Lv4    ¥500 → Lv5
export function calcLevel(totalSpent: number): number {
    if (totalSpent >= 50000) return 5; // 花了 ¥500+
    if (totalSpent >= 20000) return 4; // 花了 ¥200+
    if (totalSpent >= 10000) return 3; // 花了 ¥100+
    if (totalSpent >= 5000) return 2;  // 花了 ¥50+
    return 1; // 默认 Lv1
  }
  
  // 等级权益：Lv2 及以上购物打 9 折（1 = 原价不打折）
  export function discountFor(level: number): number {
    return level >= 2 ? 0.9 : 1;
  }
  
  // 🅲1 限时折扣：算"最终价"（活动价 → 再叠会员折扣 → 支付价）
  // 大白话：商品设了活动价且没过期 → 按活动价；过期了或没设 → 按原价；最后都乘会员折扣
  export function effectivePrice(resource: { price: number; discountPrice: number | null; discountEndAt: Date | string | null }, level: number): number {
    const now = new Date();
    // 兼容两种来源：数据库直接查（Date）或客户端序列化（字符串）
    const endAt = resource.discountEndAt ? new Date(resource.discountEndAt) : null;
    // 活动价有效 = 填了活动价 且（没设截止时间 或 还没过期）
    const onSale =
      resource.discountPrice !== null && resource.discountPrice !== undefined &&
      (endAt === null || endAt > now);
    const base = onSale ? resource.discountPrice! : resource.price; // 活动价 or 原价
    return Math.round(base * discountFor(level)); // 叠会员折扣
  }

  // 🅲1 这个商品现在有没有在打折？（列表卡片判断"显示活动价还是原价"用）
  export function isOnSale(resource: { discountPrice: number | null; discountEndAt: Date | string | null }): boolean {
    const now = new Date();
    const endAt = resource.discountEndAt ? new Date(resource.discountEndAt) : null;
    return (
      resource.discountPrice !== null && resource.discountPrice !== undefined &&
      (endAt === null || endAt > now)
    );
  }
  