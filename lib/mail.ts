// lib/mail.ts
// 第 27 课：用你的QQ邮箱给站长发提醒邮件
import nodemailer from "nodemailer";

// 一封提醒邮件：subject=标题，text=内容
export async function sendNotifyMail({
  subject,
  text,
}: {
  subject: string;
  text: string;
}) {
  // 检查配置有没有填（没填就直接跳过发信，不影响网站）
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  // 创建"邮差"（连接QQ邮箱服务器）
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true, // 465端口用SSL加密
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // 寄出邮件
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL,
    subject,
    text,
  });
}
