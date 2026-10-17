// app/not-found.tsx —— 访问不存在的网址时，自动显示这个页面（升级美化版）
import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: "600px", margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
      {/* 大图标 */}
      <div style={{ fontSize: "80px", marginBottom: "16px" }}>🧭</div>

      {/* 404 大字：渐变彩色（新技巧：文字也能渐变） */}
      <h1
        style={{
          fontSize: "100px",
          margin: 0,
          fontWeight: 800,
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        404
      </h1>

      <p style={{ color: "var(--text)", fontSize: "20px", margin: "16px 0 4px", fontWeight: 600 }}>
        页面走丢了
      </p>
      <p style={{ color: "var(--text-light)", fontSize: "15px", margin: "0 0 24px" }}>
        可能是地址写错了，或者这篇文章已经搬家了～
      </p>

      {/* 两个引导按钮：错误页也要给用户"出路" */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            background: "#2563eb",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "15px",
          }}
        >
          🏠 回首页
        </Link>
        <Link
          href="/blog"
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            border: "1px solid var(--card-border)",
            color: "var(--text)",
            textDecoration: "none",
            fontSize: "15px",
          }}
        >
          📚 去博客列表
        </Link>
      </div>
    </main>
  );
}
