import { Metadata } from 'next'

type Props = {
  params: Promise<{ id: string }>
}

// 模拟用户数据
const userList = [
  { id: 1, name: "张三", age: 22, desc: "喜欢前端开发" },
  { id: 2, name: "李四", age: 25, desc: "爱好摄影" },
  { id: 3, name: "王五", age: 28, desc: "喜欢编程" },
  { id: 4, name: "赵六", age: 21, desc: "喜欢运动" },
]

// ✅ 动态生成页面元数据（标题、描述）
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params
  const userId = Number(p.id)
  const user = userList.find(item => item.id === userId)

  if (!user) {
    return {
      title: "用户不存在",
      description: "没有找到该用户信息"
    }
  }

  return {
    title: `${user.name} | 用户详情`,
    description: `用户${user.name}，年龄${user.age}，简介：${user.desc}`
  }
}

export default async function UserDetailPage({ params }: Props) {
  const p = await params
  const userId = Number(p.id)
  const user = userList.find(item => item.id === userId)

  if (!user) {
    return <div style={{padding:'30px'}}><h1>找不到这个用户</h1></div>
  }

  return (
    <div style={{padding:'30px'}}>
      <h1>用户详情</h1>
      <p>ID:{user.id}</p>
      <p>姓名：{user.name}</p>
      <p>年龄：{user.age}</p>
      <p>介绍：{user.desc}</p>
      <div style={{marginTop:'20px'}}>
        <a href="/users">← 返回用户列表</a>
      </div>
    </div>
  )
}
