import Counter from "./components/Counter";
import Image from "next/image";

export default function Home() {
  return (
    <div className="p-8">
      <h1>🎉 我的第一个Next.js页面</h1>
      <p>零基础学习Next,跑通啦!</p>

      {/* 第一张图片 demo.jpg */}
      <div className="mt-6">
        <h3>示例图片</h3>
        <Image
          src="/demo.jpg"
          alt="示例图片"
          width={400}
          height={250}
        />
      </div>

      {/* 小猫图片 */}
      <div className="mt-6">
        <h3>小猫图片</h3>
        <Image
          src="/images/cat.jpg"
          alt="小猫"
          width={300}
          height={200}
        />
      </div>

      <Counter />
    </div>
  );
}
