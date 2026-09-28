// 模板1：纯展示，服务端组件
// 规定用户数据结构
type User = { id: number; name: string };

export default async function DemoUserPage() {
    // 网上公开接口
    const res = await fetch("https://jsonplaceholder.typicode.com/users");
    const userList = (await res.json()) as User[];

    return (
      <div className="p-8">
        <h1>练习：用户列表</h1>
        <ul>
          {userList.slice(0,4).map((u)=>(
            <li key={u.id} className="mt-2">{u.name}</li>
          ))}
        </ul>
      </div>
    )
  }
