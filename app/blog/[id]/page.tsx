// app/blog/[id]/page.tsx
// Next.js 15之后，params变成了异步的，必须await才能拿到id
export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // await params 之后才能拿到网址里面的数字，比如 /blog/1 → id就是"1"
    const { id } = await params;
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
    const blog = (await res.json()) as { id: number; title: string; body: string };

    return (
      <div className="p-8">
        <h1>博客详情</h1>
        <div className="mt-4">
          <h2>标题：{blog.title}</h2>
          <p className="mt-3">{blog.body}</p>
        </div>
        <a href="/blog" className="mt-6 block text-blue-500">← 返回博客列表</a>
      </div>
    );
  }
