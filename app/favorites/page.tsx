// app/favorites/page.tsx
// 我的收藏：列出我收藏的所有文章
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

export default async function FavoritesPage() {
  // 必须登录
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=favorites");

  // 反查：我收藏的所有记录，连带文章+作者+标签一起查出来
  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }, // 最新收藏的排前面
    include: {
      blog: {
        include: {
          user: true,
          tags: { include: { tag: true } },
        },
      },
    },
  });

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h1>❤️ 我的收藏</h1>

      {favorites.length === 0 ? (
        // 空状态：还没收藏过
        <p style={{ color: "var(--text-light)", marginTop: "20px" }}>
          还没有收藏文章，去{" "}
          <Link href="/blog" style={{ color: "var(--link)" }}>
            博客列表
          </Link>{" "}
          逛逛吧！
        </p>
      ) : (
        favorites.map((fav) => (
          <div
            key={fav.id}
            style={{
              border: "1px solid var(--card-border)",
              padding: "16px",
              marginBottom: "12px",
              borderRadius: "10px",
              background: "var(--card-bg)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {/* 封面图（有才显示） */}
            {fav.blog.coverImage && (
              <Image
                src={fav.blog.coverImage}
                alt={fav.blog.title}
                width={400}
                height={150}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              />
            )}

            {/* 标签徽章（有才显示） */}
            {fav.blog.tags.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                {fav.blog.tags.map((bt) => (
                  <span
                    key={bt.tagId}
                    style={{
                      padding: "2px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      background: "#eef2ff",
                      color: "#4338ca",
                    }}
                  >
                    #{bt.tag.name}
                  </span>
                ))}
              </div>
            )}

            <Link href={`/blog/${fav.blog.id}`} style={{ color: "var(--link)" }}>
              <h2 style={{ margin: 0 }}>{fav.blog.title}</h2>
            </Link>

            <p style={{ color: "var(--text-light)", fontSize: "14px", marginTop: "8px" }}>
              作者：{fav.blog.user?.name || "匿名"} · 📖 阅读量 {fav.blog.views} · 收藏于{" "}
              {fav.createdAt.toLocaleString()}
            </p>
          </div>
        ))
      )}
    </main>
  );
}
