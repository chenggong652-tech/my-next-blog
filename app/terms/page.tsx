// app/terms/page.tsx
// 第 34 课：用户协议（告诉用户：什么能做什么不能做）
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "用户协议 | AizyBase",
};

const SECTIONS = [
  {
    title: "一、接受条款",
    body: "访问或使用 AizyBase（aizybase.com）即表示你同意本协议全部条款。如不同意，请停止使用本网站。",
  },
  {
    title: "二、账号规则",
    body: "1. 一个邮箱只能注册一个账号。\n2. 请妥善保管你的登录密码，因密码泄露造成的损失由本人承担。\n3. 不得将账号转借、出售给他人。",
  },
  {
    title: "三、内容规则",
    body: "你发布的留言、评论、文章不得包含：违法信息、侵犯他人版权的内容、垃圾广告、人身攻击或骚扰内容。违反者，站长有权删除内容或封禁账号。",
  },
  {
    title: "四、付费资源",
    body: "本站提供的付费资源为虚拟商品（教程、提示词、模板等）。购买成功后可在\"我的下载\"中查看。虚拟商品一经下载原则上不支持退款；如资源无法正常使用，可联系站长处理。",
  },
  {
    title: "五、知识产权",
    body: "本站原创内容（包括但不限于文章、教程、AI 生成音乐）版权归本站所有。未经授权，不得转载、复制或用于商业用途。",
  },
  {
    title: "六、免责声明",
    body: "本站内容仅供参考与学习，不对内容的绝对准确性作担保。站内外部链接的风险由访问者自行承担。",
  },
  {
    title: "七、协议变更与终止",
    body: "本站可随时更新本协议，更新后在此页面公示。如你严重违反本协议，本站有权中止你的账号使用。",
  },
  {
    title: "八、联系我们",
    body: "对本协议有任何疑问，请联系：contact@aizybase.com。",
  },
];

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 60px" }}>
      <h1 style={{ fontSize: 30, textAlign: "center", margin: "8px 0 6px" }}>📜 用户协议</h1>
      <p style={{ textAlign: "center", color: "#888", fontSize: 13, margin: "0 0 28px" }}>
        生效日期：2026-10-20 ｜ AizyBase（aizybase.com）
      </p>

      {SECTIONS.map((s) => (
        <section key={s.title} style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 19, margin: "0 0 8px" }}>{s.title}</h2>
          <p style={{ margin: 0, lineHeight: 1.8, color: "#444", whiteSpace: "pre-line", fontSize: 15 }}>
            {s.body}
          </p>
        </section>
      ))}

      <p style={{ textAlign: "center", marginTop: 32, fontSize: 14 }}>
        <Link href="/" style={{ color: "#6366f1" }}>← 返回首页</Link>
      </p>
    </main>
  );
}