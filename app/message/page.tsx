// app/message/page.tsx
// 留言板（服务端组件：数据库读取、登录检查都在服务器完成）
import MessageEditBtn from "@/app/components/MessageEditBtn";   // 留言编辑按钮组件
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { addMessage } from "./actions";
import LikeBtn from "./LikeBtn";
import DeleteBtn from "./DeleteBtn";

// 每页显示 5 条
const PAGE_SIZE = 5;

export default async function MessagePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // 服务端：获取登录状态 + 当前页码
  const session = await auth();
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const skip = (page - 1) * PAGE_SIZE;

  // 服务端：读留言总数 + 当前页留言（连带作者信息和点赞记录）
  const [totalCount, messageList] = await Promise.all([
    prisma.message.count(),
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, likes: true },
      skip,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPage = Math.ceil(totalCount / PAGE_SIZE);
  const currentUserId = session?.user?.id ?? null;

  return (
    <main style={{ maxWidth: "700px", margin: "40px auto" }}>
      <h1>留言板</h1>

      {/* 已登录：显示发布表单 */}
      {session ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
            margin: "20px 0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <form action={addMessage} style={{ display: "grid", gap: "10px" }}>
            <input
              name="name"
              defaultValue={session.user?.name ?? ""}
              placeholder="你的昵称"
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
              }}
            />
            <textarea
              name="content"
              placeholder="写下你的留言……"
              required
              style={{
                width: "100%",
                height: 90,
                padding: 10,
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "15px",
                justifySelf: "start",
              }}
            >
              提交留言
            </button>
          </form>
        </div>
      ) : (
        <p style={{ color: "#666", margin: "20px 0" }}>登录之后才可以发布留言</p>
      )}

      {/* 留言列表 */}
      <div style={{ marginTop: 10 }}>
        {messageList.length === 0 ? (
          <p>还没有留言</p>
        ) : (
          messageList.map((msg) => {
            // 判断当前用户是否点过赞
            const liked = msg.likes.some((l) => l.userId === currentUserId);
            return (
              <div
                key={msg.id}
                style={{
                  border: "1px solid #e5e7eb",
                  padding: 14,
                  marginBottom: 12,
                  borderRadius: 10,
                  background: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <p style={{ margin: 0 }}>
                  <Link href={`/profile/${msg.userId}`} style={{ color: "#2563eb" }}>
                    {msg.user?.name || "匿名"}
                  </Link>
                  <span style={{ fontSize: 12, color: "#777", marginLeft: 10 }}>
                    {msg.createdAt.toLocaleString()}
                  </span>
                </p>
                <p style={{ marginTop: 8 }}>{msg.content}</p>

                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: 10 }}>
                  {/* 点赞按钮（客户端组件，点一下即时变化） */}
                  <LikeBtn
                    messageId={msg.id}
                    likeCount={msg.likes.length}
                    liked={liked}
                    isLoggedIn={!!session}
                  />

                  {/* 只有留言本人才能编辑、删除 */}
                  {currentUserId === msg.userId && (
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <MessageEditBtn messageId={msg.id} oldContent={msg.content} />
                      <DeleteBtn messageId={msg.id} />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 分页 */}
      {totalPage > 1 && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "30px",
            alignItems: "center",
          }}
        >
          {page <= 1 ? (
            <button disabled style={{ opacity: 0.4, cursor: "not-allowed" }}>
              上一页
            </button>
          ) : (
            <Link href={`/message?page=${page - 1}`}>
              <button>上一页</button>
            </Link>
          )}

          <span>
            {page} / {totalPage}
          </span>

          {page >= totalPage ? (
            <button disabled style={{ opacity: 0.4, cursor: "not-allowed" }}>
              下一页
            </button>
          ) : (
            <Link href={`/message?page=${page + 1}`}>
              <button>下一页</button>
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
