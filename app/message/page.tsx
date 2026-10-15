// app/message/page.tsx
// 留言板（服务端组件：数据库读取、登录检查都在服务器完成）
import MessageEditBtn from "@/app/components/MessageEditBtn";   // 留言编辑按钮组件
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { addMessage } from "./actions";
import LikeBtn from "./LikeBtn";
import DeleteBtn from "./DeleteBtn";
import ReplyBox from "@/app/components/ReplyBox";

// 每页显示 5 条
const PAGE_SIZE = 5;

export default async function MessagePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  // 服务端：获取登录状态 + 当前页码
  const session = await auth();
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const q = sp.q?.trim() || ""; // 搜索关键词（没有就是空）
  // 搜索条件：有关键词就筛选"内容包含关键词"的留言
  const where: any = {};
  if (q) where.content = { contains: q };
  const skip = (page - 1) * PAGE_SIZE;

  // 服务端：读留言总数 + 当前页留言（连带作者信息和点赞记录）
  const [totalCount, messageList] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        likes: true,
        replies: { include: { user: true }, orderBy: { createdAt: "asc" } },
      },
      skip,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPage = Math.ceil(totalCount / PAGE_SIZE);
  const currentUserId = session?.user?.id ?? null;

  return (
    <main style={{ maxWidth: "700px", margin: "40px auto" }}>
      <h1>留言板</h1>
      
      {/* 搜索框：GET 提交，关键词进网址 */}
      <form
        action="/message"
        method="GET"
        style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索留言内容……"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--card-border)",
            fontSize: "14px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          搜索
        </button>
        {q && (
          <Link
            href="/message"
            style={{ alignSelf: "center", fontSize: "14px", color: "var(--link)" }}
          >
            清除
          </Link>
        )}
      </form>

      {/* 已登录：显示发布表单 */}
      {session ? (
        <div
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
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
        <p style={{ color: "var(--text-light)", margin: "20px 0" }}>登录之后才可以发布留言</p>
      )}

      {/* 留言列表 */}
      <div style={{ marginTop: 10 }}>
      {messageList.length === 0 ? (
          <p>{q ? `没有找到"${q}"相关的留言` : "还没有留言"}</p>
        ) : (
          messageList.map((msg) => {
            // 判断当前用户是否点过赞
            const liked = msg.likes.some((l) => l.userId === currentUserId);
            return (
              <div
                key={msg.id}
                style={{
                  border: "1px solid var(--card-border)",
                  padding: 14,
                  marginBottom: 12,
                  borderRadius: 10,
                  background: "var(--card-bg)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <p style={{ margin: 0 }}>
                  <Link href={`/profile/${msg.userId}`} style={{ color: "var(--link)" }}>
                    {msg.user?.name || "匿名"}
                  </Link>
                  <span style={{ fontSize: 12, color: "var(--text-light)", marginLeft: 10 }}>
                    {msg.createdAt.toLocaleString()}
                  </span>
                </p>
                <p style={{ marginTop: 8 }}>{msg.content}</p>
                                {/* 回复列表：这条留言下面的所有回复 */}
                                {msg.replies.length > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      background: "rgba(0,0,0,0.03)",
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}
                  >
                    {msg.replies.map((rep) => (
                      <div
                        key={rep.id}
                        style={{
                          fontSize: 13,
                          padding: "4px 0",
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                        }}
                      >
                        <span style={{ color: "var(--link)", fontWeight: 600 }}>
                          {rep.user?.name || "匿名"}
                        </span>
                        <span style={{ color: "var(--text-light)", fontSize: 12, marginLeft: 8 }}>
                          {rep.createdAt.toLocaleString()}
                        </span>
                        <div style={{ marginTop: 2 }}>{rep.content}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: 10 }}>
                  {/* 点赞按钮（客户端组件，点一下即时变化） */}
                                    {/* 回复按钮：登录了就能用（放在"只能自己编辑删除"的外面） */}
                                    {session && <ReplyBox messageId={msg.id} />}
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
            <Link href={`/message?q=${encodeURIComponent(q)}&page=${page - 1}`}>
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
            <Link href={`/message?q=${encodeURIComponent(q)}&page=${page + 1}`}>
              <button>下一页</button>
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
