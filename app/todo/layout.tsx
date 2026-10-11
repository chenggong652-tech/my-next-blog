export const metadata = {
    title: '待办事项清单',
    description: 'Next.js零基础实战项目，待办清单'
  }
  
  export default function TodoLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return <>{children}</>
  }
  