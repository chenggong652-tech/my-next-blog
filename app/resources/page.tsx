// app/resources/page.tsx
// 第 30-31 课：资源上架 + 付费下载（卡片带购买/下载按钮）
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import ResourceCard from "./ResourceCard";

// 每次访问都实时查数据库（不缓存旧数据）
export const dynamic = "force-dynamic";

// 分类筛选按钮列表
const CATEGORIES = ["全部", "AI 教程", "提示词", "工具", "模板"];

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  // 读取地址栏里的分类参数，比如 /resources?cat=提示词
  const { cat } = await searchParams;
  const current = cat || "全部";

  // 从数据库拿"已上架"的资源，按分类过滤 + 排序
  const resources = await prisma.resource.findMany({
    where: {
      status: "published",
      ...(current !== "全部" ? { category: current } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  // 第 31 课：查当前登录用户的余额 + 已购列表（决定按钮显示"购买"还是"下载"）
  const session = await auth();
  let balance = 0;
  let level = 1;
  let ownedIds = new Set<string>();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true, level: true },
    });
    balance = user?.balance ?? 0;
    level = user?.level ?? 1;
    const purchases = await prisma.purchase.findMany({
      where: { userId: session.user.id },
      select: { resourceId: true },
    });
    ownedIds = new Set(purchases.map((p) => p.resourceId));
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px 60px" }}>
      <h1 style={{ textAlign: "center", fontSize: 32, margin: "8px 0 4px" }}>🎁 AI 资源库</h1>
      <p style={{ textAlign: "center", color: "#666", margin: "0 0 24px" }}>
        教程 / 提示词 / 工具 / 模板，全部拿来即用
        {session?.user?.id && (
          <span style={{ display: "block", marginTop: 6, fontSize: 14 }}>
            ⭐ Lv.{level} 会员 · 💰 我的余额：¥{(balance / 100).toFixed(2)}{" "}
            {level >= 2 ? (
              <span style={{ color: "#a855f7", marginLeft: 8 }}>🎉 Lv.{level} 已解锁 9 折，购物自动打折</span>
            ) : (
              <span style={{ color: "#999", marginLeft: 8, fontSize: 13 }}>升级提示：累计消费满 ¥50 升 Lv.2，解锁 9 折</span>
            )}
            <Link href="/topup" style={{ color: "#f59e0b" }}>去充值</Link> ·{" "}
            <Link href="/resources/mine" style={{ color: "#6366f1" }}>我的下载</Link>
          </span>
        )}
      </p>

      {/* 分类筛选按钮 */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={c === "全部" ? "/resources" : `/resources?cat=${encodeURIComponent(c)}`}
            style={{
              padding: "8px 20px",
              borderRadius: 999,
              textDecoration: "none",
              fontSize: 15,
              border: "1px solid #ddd",
              background: c === current ? "#6366f1" : "#fff",
              color: c === current ? "#fff" : "#333",
            }}
          >
            {c}
          </Link>
        ))}
      </div>

      {/* 资源卡片网格 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {resources.map((r) => (
          <ResourceCard key={r.id} r={r} owned={ownedIds.has(r.id)} balance={balance} />
        ))}

        {resources.length === 0 && (
          <p style={{ textAlign: "center", color: "#999", gridColumn: "1 / -1", padding: 40 }}>
            这个分类还没有资源，稍后再来看看～
          </p>
        )}
      </div>
    </main>
  );
}
