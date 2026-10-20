// app/admin/ResourceSaleForm.tsx
// 🅲1 后台资源促销管理：每个资源一行，可设活动价 + 截止时间（留空=取消活动）
"use client";
import { useActionState } from "react";
import { useEffect, useState } from "react";
import { useToast } from "@/app/components/Toast";
import { setResourceSale } from "./actions";

type SaleState = { success?: boolean; msg?: string };
type Props = {
  r: {
    id: string;
    title: string;
    price: number;
    discountPrice: number | null;
    discountEndAt: Date | null;
    status: string;
  };
};

export default function ResourceSaleForm({ r }: Props) {
  const [state, formAction] = useActionState<SaleState, FormData>(setResourceSale, {});
  const { showToast } = useToast();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (state?.msg) showToast(state.msg, state.success ? "ok" : "err");
  }, [state]);

  // 现在有没有活动（跟商品页同一个判断逻辑）
  const now = new Date();
  const onSale =
    r.discountPrice !== null &&
    r.discountPrice !== undefined &&
    (r.discountEndAt === null || new Date(r.discountEndAt) > now);

  // 默认值回显：有活动就显示当前活动价/截止时间
  const defaultPrice = r.discountPrice != null ? String(r.discountPrice) : "";
  const defaultEnd =
    r.discountEndAt != null && new Date(r.discountEndAt) > now
      ? new Date(r.discountEndAt).toISOString().slice(0, 16)
      : "";

  return (
    <form
      action={formAction}
      onSubmit={() => setDone(false)}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
        borderTop: "1px solid #f0f0f0",
        padding: "10px 0",
      }}
    >
      <input type="hidden" name="id" value={r.id} />
      <div style={{ minWidth: 180, fontSize: 14 }}>
        <strong>{r.title}</strong>
        <div style={{ color: "#999", fontSize: 12, marginTop: 2 }}>
          原价 ¥{(r.price / 100).toFixed(1)}
          {onSale && (
            <span style={{ color: "#dc2626", fontWeight: 600, marginLeft: 6 }}>
              ⏰ 活动价 ¥{((r.discountPrice as number) / 100).toFixed(1)}
              {r.discountEndAt && `（截止 ${new Date(r.discountEndAt).toLocaleString("zh-CN")}）`}
            </span>
          )}
        </div>
      </div>
      <input
        name="discountPrice"
        type="number"
        placeholder="活动价(分)，如 490"
        defaultValue={defaultPrice}
        style={{ width: 110, padding: "6px 8px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
      />
      <input
        name="discountEndAt"
        type="datetime-local"
        defaultValue={defaultEnd}
        style={{ width: 170, padding: "6px 8px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
      />
      <button
        type="submit"
        style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, cursor: "pointer" }}
      >
        {onSale ? "更新活动" : "🚀 上活动"}
      </button>
      {onSale && (
        <button
          type="submit"
          name="cancel"
          value="1"
          onClick={() => setDone(true)}
          style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #999", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" }}
        >
          取消活动
        </button>
      )}
      {r.status === "hidden" && (
        <span style={{ fontSize: 12, color: "#999" }}>（已下架）</span>
      )}
    </form>
  );
}
