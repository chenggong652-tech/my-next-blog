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
  