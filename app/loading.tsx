// app/loading.tsx —— 页面加载中时，自动显示这个动画（加载完自动消失）
export default function Loading() {
    return (
      <main style={{ maxWidth: "700px", margin: "40px auto", textAlign: "center", color: "var(--text-light)" }}>
        <p style={{ fontSize: "18px" }}>⏳ 加载中……</p>
      </main>
    );
  }
  