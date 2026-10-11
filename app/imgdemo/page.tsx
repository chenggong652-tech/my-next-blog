import Image from 'next/image'

export default function ImgDemoPage() {
  return (
    <div style={{padding:30}}>
      <h1>Image组件演示</h1>
      <h3>本地图片</h3>
      <Image
        src="/demo.jpg"
        alt="示例图片"
        width={400}
        height={300}
      />

      <h3 style={{marginTop:30}}>远程网络图片</h3>
      <Image
        src="https://picsum.photos/400/300"
        alt="网络随机图"
        width={400}
        height={300}
      />

      <h3 style={{marginTop:30}}>fill模式图片</h3>
      <div style={{
        position:"relative",
        width:400,
        height:250,
        border:"1px solid #aaa"
      }}>
        <Image
          src="/demo.jpg"
          alt="fill示例"
          fill
          style={{objectFit:"cover"}}
        />
      </div>
    </div>
  )
}
