# 我的简易博客网站

一个用 Next.js 亲手搭出来的个人博客：写文章、留言互动、后台管理、一键备份。

## ✨ 功能清单

- **文章**：发布 / 编辑 / 删除、Markdown 排版、封面图上传、分类筛选、标签
- **互动**：留言板、评论区（支持点赞）、文章收藏、微信分享卡片
- **用户**：注册 / 登录、改昵称、改密码、个人主页、浏览历史
- **后台**：数据统计看板、文章管理、用户管理、CSV 数据备份
- **体验**：深色模式、相对时间、阅读进度条、返回顶部、上一篇/下一篇、标签云、文章归档
- **性能**：数据缓存（首页/列表秒开）、分页、阅读量防刷、搜索高亮

## 🛠️ 技术栈

- Next.js + React
- Prisma + Neon PostgreSQL
- NextAuth 登录

## 🚀 本地运行

```bash
npm install      # 第一次装依赖
npm run dev      # 启动开发服务器
```

打开 http://localhost:3000 即可访问。

## ☁️ 部署到线上（Vercel）

**你一直在用的方法：GitHub 推送**

```bash
# 1. 先本地验证（能构建成功，线上才能部署成功）
npm run build

# 2. 推上去，Vercel 自动部署上线
git add -A
git commit -m "更新内容"
git push origin main
```

> 环境变量（数据库连接串那些）：**第一次部署时已经配好了，不用动**。
> 以后要改：Vercel 项目 → Settings → Environment Variables，对照本地 `.env` 里的变量名添加上去就行。

## 📦 数据备份

登录后台 →「数据备份」→ 下载 文章 / 留言 / 用户 三个 CSV。

## 🗂️ 目录速览

- `app/page.tsx` 首页
- `app/blog` 博客（列表 / 详情 / 发布 / 编辑）
- `app/admin` 管理后台
- `app/components` 通用组件
- `prisma/schema.prisma` 数据库表结构
