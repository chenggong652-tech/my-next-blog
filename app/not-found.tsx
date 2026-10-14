// app/not-found.tsx —— 访问不存在的网址时，自动显示这个页面
import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: "600px", margin: "80px auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "72px", margin: 0, color: "var(--text)" }}>404</h1>
      <p style={{ color: "var(--text-light)", fontSize: "18px" }}>
        哎呀，这个页面走丢了……
      </p>
      <Link href="/" style={{ color: "var(--link)", fontSize: "16px" }}>
        ← 回首页看看
      </Link>
    </main>
  );
}
