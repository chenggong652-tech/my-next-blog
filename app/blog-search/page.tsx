"use client";
import { useState, useEffect } from "react";

type BlogItem = {
  id: number;
  title: string;
};

export default function BlogSearchPage() {
  // 保存全部博客原始数据
  const [allBlogs, setAllBlogs] = useState<BlogItem[]>([]);
  // 保存搜索框输入的文字
  const [keyword, setKeyword] = useState("");

  // 页面加载完成后，拉取博客数据
  useEffect(() => {
    async function loadBlog() {
      const res = await fetch("https://jsonplaceholder.typicode.com/posts");
      const data = await res.json();
      setAllBlogs(data.slice(0,12));
    }
    loadBlog();
  }, []);

  // 根据关键词过滤博客列表
  const filterBlogs = allBlogs.filter((item) => {
    return item.title.includes(keyword);
  });

  return (
    <div className="p-8">
      <h1>博客搜索页面</h1>
      {/* 搜索输入框 */}
      <input
        className="border p-2 w-80 mt-4"
        placeholder="输入关键词搜索博客标题"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <ul className="mt-6">
        {filterBlogs.map((blog) => (
          <li key={blog.id} className="mt-2 text-blue-600">
            {blog.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
