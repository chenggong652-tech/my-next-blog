'use client'
import { useState, useEffect } from 'react'

export default function CommentPage() {
  // 初始化的时候，从浏览器本地读取旧留言
  const [list, setList] = useState<string[]>([])
  const [inputText, setInputText] = useState('')

  // 页面第一次打开，读取本地保存的留言
  useEffect(() => {
    const saved = localStorage.getItem('myCommentList')
    if (saved) {
      setList(JSON.parse(saved))
    }
  }, [])

  // 只要留言列表发生变化，自动保存到浏览器本地
  useEffect(() => {
    localStorage.setItem('myCommentList', JSON.stringify(list))
  }, [list])

  // 提交留言
  function handleSubmit() {
    const content = inputText.trim()
    if (!content) return
    setList([content, ...list])
    setInputText('')
  }

  // 删除单条留言
  function deleteItem(index: number) {
    const newList = list.filter((_, i) => i !== index)
    setList(newList)
  }

  // 清空全部留言
  function clearAll() {
    setList([])
  }

  return (
    <div style={{padding: '30px'}}>
      <h1>留言板（刷新页面留言不消失）</h1>
      <div>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="在这里输入留言..."
          style={{padding:'8px', width:'300px'}}
        />
        <button 
          onClick={handleSubmit}
          style={{marginLeft:'10px', padding:'8px 16px'}}
        >
          提交留言
        </button>
        <button 
          onClick={clearAll}
          style={{marginLeft:'10px', padding:'8px 16px', background:'orange', color:'white', border:'none', borderRadius:'4px'}}
        >
          清空全部
        </button>
      </div>

      <div style={{marginTop:'30px'}}>
        <h3>留言列表：</h3>
        {list.length === 0 ? (
          <p>暂无留言</p>
        ) : (
          list.map((item, index) => (
            <div key={index} style={{border:'1px solid #ccc', padding:'10px', marginTop:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span>{item}</span>
              <button 
                onClick={() => deleteItem(index)}
                style={{padding:'4px 8px', color:'white', background:'#dc2626', border:'none', borderRadius:'4px'}}
              >
                删除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
