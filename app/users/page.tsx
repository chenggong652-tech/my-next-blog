// 服务端组件，不需要"use client"
// 规定用户数据结构
type User = { id: number; name: string; email: string };

export default async function UserPage() {
    // 从网上公开测试接口拿用户数据
    const res = await fetch("https://jsonplaceholder.typicode.com/users");
    const userList = (await res.json()) as User[];

    // 只取前面5个用户
    const firstFiveUsers = userList.slice(0,5);

    return (
      <div className="p-8">
        <h1>用户列表(只展示前5条)</h1>
        <ul>
          {firstFiveUsers.map((user) => (
            <li key={user.id} className="mt-2">
              {user.name} | {user.email}
            </li>
          ))}
        </ul>
      </div>
    );
  }
