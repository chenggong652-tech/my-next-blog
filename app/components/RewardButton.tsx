"use client";
// app/components/RewardButton.tsx
// 第 25 课：赞赏按钮（第一个变现入口）
import { useState } from "react";

export default function RewardButton() {
  const [open, setOpen] = useState(false); // 弹窗开/关（点按钮开，点背景关）
  const [imgOk, setImgOk] = useState(true); // 收款码图片加载成功了吗（加载失败就显示占位）

  return (
    <>
      {/* 赞赏按钮 */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 22px",
          borderRadius: "999px",
          border: "none",
          background: "linear-gradient(135deg,#f59e0b,#ef4444)",
          color: "#fff",
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(239,68,68,0.25)",
        }}
      >
        💖 赞赏作者
      </button>

      {/* 弹窗（点灰色背景 = 关闭） */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "320px",
              width: "90%",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "20px" }}>感谢你的支持！🙏</h3>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "8px 0 16px" }}>
              扫一扫下方二维码，请作者喝杯咖啡 ☕
            </p>

            {/* 收款码：把你的微信收款码截图保存到 public/reward/wechat.jpg 就能收款 */}
            {imgOk && (
              <img
                src="/reward/wechat.jpg"
                alt="赞赏码"
                onError={() => setImgOk(false)}
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  objectFit: "cover",
                }}
              />
            )}
            {/* 图片还没放时：显示占位框（不破图） */}
            {!imgOk && (
              <div
                style={{
                  width: 180,
                  height: 180,
                  margin: "0 auto",
                  borderRadius: "12px",
                  border: "2px dashed #cbd5e1",
                  color: "#94a3b8",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                收款码位置
                <br />
                （放好图片自动显示）
              </div>
            )}

            <p style={{ color: "#94a3b8", fontSize: "12px", margin: "16px 0 0" }}>
              建议金额：¥1 / ¥5 / ¥10 · 心意最重要
            </p>
            <button
              onClick={() => setOpen(false)}
              style={{
                marginTop: "12px",
                padding: "8px 24px",
                borderRadius: "999px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#475569",
                cursor: "pointer",
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
