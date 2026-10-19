// app/resources/mine/page.tsx
// 第 31 课：我的下载 —— 我买过/可下载的资源清单
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MinePage() {
  // 没登录 → 提示去登录
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: 40, textAlign: "center" }}>
        <p>请先登录，才能看"我的下载"～</p>
        <Link href="/login" style={{ color: "#6366f1" }}>去登录</Link>
      </main>
    );
  }

  // 查我买过的资源（带上资源信息）
  const purchases = await prisma.purchase.findMany({
    where: { userId: session.user.id },
    include: { resource: true },
    orderBy: { createdAt: "desc" },
  });

  // 免费资源没进购买表，但也能下载 → 单独把免费资源也列进来
  const freeResources = await prisma.resource.findMany({
    where: { status: "published", price: 0 },
    orderBy: { sortOrder: "asc" },
  });

  // 合并成一个列表（已购在前，免费在后）
  const owned = new Map<string, typeof purchases[number]>();
  purchases.forEach((p) => owned.set(p.resource.id, p));
  const list = [
    ...purchases.map((p) => p.resource),
    ...freeResources.filter((r) => !owned.has(r.id)),
  ];

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 60px" }}>
      <h1 style={{ fontSize: 26 }}>📥 我的下载</h1>
      <p style={{ color: "#666", margin: "0 0 20px" }}>
        你买过的付费资源 + 全部免费资源，点下载按钮直接拿
      </p>

      {list.length === 0 ? (
        <p style={{ color: "#999", padding: 40, textAlign: "center" }}>
          还没有可下载的资源，去 <Link href="/resources" style={{ color: "#6366f1" }}>资源库</Link> 逛逛～
        </p>
      ) : (
        list.map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 10,
              background: "#fff",
            }}
          >
            {/* 小封面 */}
            <div style={{ width: 64, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0,
              background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {r.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "#fff", fontSize: 18 }}>{r.title[0]}</span>
              )}
            </div>

            {/* 标题 + 来源 */}
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{r.title}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#999" }}>
                {owned.has(r.id) ? "🛒 已购买" : "🎁 免费资源"}
              </p>
            </div>

            {/* 下载按钮 */}
            {r.downloadUrl ? (
              <a
                href={r.downloadUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "8px 18px", borderRadius: 8, textDecoration: "none",
                  background: "#6366f1", color: "#fff", fontSize: 14, flexShrink: 0,
                }}
              >
                下载
              </a>
            ) : (
              <span style={{ fontSize: 12, color: "#999", flexShrink: 0 }}>未提供链接</span>
            )}
          </div>
        ))
      )}

      <p style={{ marginTop: 24, fontSize: 13, color: "#999" }}>
        <Link href="/resources">← 返回资源库</Link>
      </p>
    </main>
  );
}
