// app/admin/orders/OrderActions.tsx
// 🅲3 订单操作按钮：待支付→补登收款；已支付→退款
"use client";
import { useRouter } from "next/navigation";
import { markOrderPaid, refundOrder } from "../actions";

export default function OrderActions({
  orderId,
  status,
  resourceTitle,
  amount,
}: {
  orderId: string;
  status: string;
  resourceTitle: string;
  amount: number;
}) {
  const router = useRouter();

  // 大白话：顾客说"我转账了"，你确认到账 → 点这个按钮，把订单改成已支付
  async function handleMarkPaid() {
    if (
      !window.confirm(
        `确认收到《${resourceTitle}》¥${(amount / 100).toFixed(1)} 的款项？\n确认后订单变已支付，并自动给推广员结 20% 佣金。`
      )
    )
      return;
    const fd = new FormData();
    fd.set("orderId", orderId);
    const res = await markOrderPaid(fd);
    alert(res.msg || (res.success ? "操作成功" : "操作失败"));
    router.refresh();
  }

  // 大白话：顾客要退 → 点这个，钱退回他余额，推广佣金收回，购买资格取消
  async function handleRefund() {
    if (
      !window.confirm(
        `确定给《${resourceTitle}》¥${(amount / 100).toFixed(1)} 退款？\n钱会退回买家余额，推广佣金会扣回。`
      )
    )
      return;
    const fd = new FormData();
    fd.set("orderId", orderId);
    const res = await refundOrder(fd);
    alert(res.msg || (res.success ? "操作成功" : "操作失败"));
    router.refresh();
  }

  if (status === "pending") {
    return (
      <button
        onClick={handleMarkPaid}
        style={{
          padding: "6px 14px",
          borderRadius: "8px",
          border: "none",
          background: "#16a34a",
          color: "#fff",
          fontSize: "13px",
          cursor: "pointer",
        }}
      >
        ✅ 标记已支付
      </button>
    );
  }
  if (status === "paid") {
    return (
      <button
        onClick={handleRefund}
        style={{
          padding: "6px 14px",
          borderRadius: "8px",
          border: "1px solid #dc2626",
          background: "#fff",
          color: "#dc2626",
          fontSize: "13px",
          cursor: "pointer",
        }}
      >
        ↩️ 退款
      </button>
    );
  }
  return null; // 已取消/已退款的订单不需要操作
}
