'use client'
import Link from 'next/link'

// 模拟用户数据
const userList = [
  { id: 1, name: "张三", age: 22, desc: "喜欢前端开发" },
  { id: 2, name: "李四", age: 25, desc: "爱好摄影" },
  { id: 3, name: "王五", age: 28, desc: "喜欢编程" },
  { id: 4, name: "赵六", age: 21, desc: "喜欢运动" },
]

export default function UsersPage() {
  return (
    <div style={{padding:'30px'}}>
      <h1>用户列表</h1>
      <div style={{marginTop:'20px'}}>
        {userList.map(user => (
          <div key={user.id} style={{border:'1px solid #ccc', padding:'12px', marginTop:'8px'}}>
            <p>姓名：{user.name}</p>
            <p>年龄：{user.age}</p>
            {/* Link跳转，把用户id带到地址栏 */}
            <Link href={`/users/${user.id}`}>
              <button style={{padding:'6px 10px', background:'#2563eb', color:'white', border:'none', borderRadius:'4px'}}>
                查看详情
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
