// 服务端组件，可以读取服务端环境变量
export default async function EnvDemoPage() {
    // 服务端变量
    const serverMsg = process.env.SERVER_NOTE;
    // 带 NEXT_PUBLIC_ 的公开变量
    const publicName = process.env.NEXT_PUBLIC_WEB_NAME;
  
    return (
      <main style={{maxWidth:"600px",margin:"40px auto"}}>
        <h1>环境变量演示页面</h1>
        <p>服务端读取:SERVER_NOTE = {serverMsg}</p>
        <p>公开变量:NEXT_PUBLIC_WEB_NAME = {publicName}</p>
      </main>
    )
  }
  