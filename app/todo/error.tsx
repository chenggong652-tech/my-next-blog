'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 控制台打印错误信息（给我们调试看）
    console.error(error)
  }, [error])

  return (
    <div style={{padding:"30px"}}>
      <h2>页面出错啦！</h2>
      <p>发生了一些问题，请点击下面按钮重试</p>
      <button onClick={() => reset()} style={{padding:"6px 12px"}}>
        重新加载
      </button>
    </div>
  )
}
