// app/promo/page.tsx
// C2 推广中心：我的推广名片（发出去赚钱）+ 佣金明细（谁通过我买了啥）
// 大白话：这里是你网站的"销售提成台"——把你的专属链接发给朋友，他们买东西你就赚 20%
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PromoClient from "./PromoClient";

// 每次访问实时查（佣金数字要新鲜）
export const dynamic = "force-dynamic";

export default async function PromoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // 我的资料：推广码 + 佣金余额（没有推广码就现场补一张，老账号兜底）
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { refCode: true, commission: true, name: true },
  });
  let refCode = me?.refCode;
  if (!refCode) {
    // 极少数老账号没有推广码 → 现场补一张（正常注册/脚本补发过都有）
    const { uniqueRefCode } = await import("@/lib/ref");
    refCode = await uniqueRefCode(prisma);
    await prisma.user.update({ where: { id: session.user.id }, data: { refCode } });
  }

  // 我的佣金明细（谁通过我的链接买了啥，我赚了多少）
  const records = await prisma.commission.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // 我的推广业绩统计
  const refOrders = await prisma.order.count({ where: { refUserId: session.user.id, status: "paid" } });
  const buyers = await prisma.order.findMany({
    where: { refUserId: session.user.id, status: "paid" },
    select: { userId: true },
  });
  const uniqueBuyers = new Set(buyers.map((b) => b.userId)).size;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 60px" }}>
      <h1 style={{ textAlign: "center", margin: "0 0 4px" }}>🤝 推广赚钱</h1>
      <p style={{ textAlign: "center", color: "#666", margin: "0 0 28px", fontSize: 14 }}>
        把专属链接发给朋友，TA 买东西你赚 <b>20%</b> 佣金
      </p>

      {/* 我的推广名片 */}
      <PromoClient refCode={refCode} siteUrl={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"} />

      {/* 我的业绩统计 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, margin: "24px 0" }}>
        <div style={{ background: "#f5f5ff", borderRadius: 12, padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#6366f1" }}>¥{(me?.commission ?? 0) / 100}</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>累计佣金（元）</div>
        </div>
        <div style={{ background: "#f5f5ff", borderRadius: 12, padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#6366f1" }}>{uniqueBuyers}</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>带来客户（人）</div>
        </div>
        <div style={{ background: "#f5f5ff", borderRadius: 12, padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#6366f1" }}>{refOrders}</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>成交订单（笔）</div>
        </div>
      </div>

      {/* 佣金明细 */}
      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>💸 佣金明细（最近 50 条）</h2>
      {records.length === 0 ? (
        <p style={{ color: "#999", fontSize: 14, background: "#fafafa", padding: 20, borderRadius: 10 }}>
          还没有佣金记录——把你的推广链接发出去，朋友一买你就看得到了 🚀
        </p>
      ) : (
        <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
          {records.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontSize: 14 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{c.resourceTitle}</div>
                <div style={{ color: "#999", fontSize: 12, marginTop: 2 }}>
                  {c.buyerName} 购买 · {c.createdAt.toLocaleString("zh-CN")}
                </div>
              </div>
              <span style={{ color: "#16a34a", fontWeight: 700 }}>+¥{(c.amount / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#999" }}>
        佣金先存在账户里，攒够 50 元可以联系站长提现（或直接用来买资源）
      </p>
      <p style={{ textAlign: "center", marginTop: 8 }}>
        <Link href="/resources" style={{ color: "#6366f1", fontSize: 14 }}>← 回资源库逛逛</Link>
      </p>
    </main>
  );
}
