// app/blog/page.tsx
// 规定每篇博客的结构
type BlogPost = { id: number; title: string };

export default async function BlogListPage() {
    // 网上公开测试博客数据
    const res = await fetch("https://jsonplaceholder.typicode.com/posts");
    const blogList = (await res.json()) as BlogPost[];

    // 只拿前6篇博客
    const showBlogs = blogList.slice(0,6);

    return (
      <div className="p-8">
        <h1>博客列表页</h1>
        <ul className="mt-4">
          {showBlogs.map((blog) => (
            <li key={blog.id} className="mt-3">
              {/* 点标题跳转到详情页，id会跟着网址走 */}
              <a href={`/blog/${blog.id}`} className="text-blue-500">
                {blog.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }
