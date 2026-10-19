// app/admin/badwords/page.tsx
// 第 D3 课：敏感词库管理页（管理员网页上加词/删词）
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export const dynamic = "force-dynamic";

// 新增敏感词（网页表单提交 → 写进数据库）
async function addWord(formData: FormData) {
  "use server";
  if (!(await isAdmin())) return;
  const word = String(formData.get("word") || "").trim();
  if (!word) return;
  const exists = await prisma.badWord.findUnique({ where: { word } });
  if (!exists) {
    await prisma.badWord.create({ data: { word } });
  }
  revalidatePath("/admin/badwords");
}

// 删除敏感词
async function deleteWord(formData: FormData) {
  "use server";
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.badWord.delete({ where: { id } });
  revalidatePath("/admin/badwords");
}

export default async function BadWordsPage() {
  if (!(await isAdmin())) {
    return (
      <main style={{ maxWidth: 800, margin: "40px auto", textAlign: "center" }}>
        <h1>🔒 无权访问</h1>
        <p style={{ color: "#666" }}>这里只有管理员能进哦</p>
        <Link href="/" style={{ color: "#6366f1" }}>← 回首页</Link>
      </main>
    );
  }

  // 全部敏感词（按最新添加的排前面）
  const words = await prisma.badWord.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 60px" }}>
      <h1 style={{ fontSize: 28, textAlign: "center", margin: "8px 0 4px" }}>🔞 敏感词库</h1>
      <p style={{ textAlign: "center", color: "#666", margin: "0 0 24px" }}>
        加一个词 → 留言/评论立刻拦它（当前 {words.length} 个）
        <Link href="/admin" style={{ display: "block", marginTop: 6, color: "#6366f1", fontSize: 14 }}>← 回后台</Link>
      </p>

      {/* 添加区 */}
      <form action={addWord} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          name="word"
          placeholder="输入要拦截的词，如：免费领"
          style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
        />
        <button style={{ padding: "10px 18px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", fontSize: 14, cursor: "pointer" }}>
          ➕ 添加
        </button>
      </form>

      {/* 词列表 */}
      {words.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999", padding: "30px 0" }}>词库还是空的，先加一个试试</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {words.map((w) => (
            <form key={w.id} action={deleteWord} style={{ display: "inline-block", margin: 0 }}>
              <input type="hidden" name="id" value={w.id} />
              <button
                style={{
                  padding: "6px 12px", borderRadius: 999, border: "1px solid #eee", cursor: "pointer",
                  fontSize: 13, background: "#f9fafb",
                }}
                title="点它删除"
              >
                {w.word} ✕
              </button>
            </form>
          ))}
        </div>
      )}
    </main>
  );
}