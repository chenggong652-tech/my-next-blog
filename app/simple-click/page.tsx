"use client";
import { useState, useEffect } from "react";

type Todo = {
  id: string;
  content: string;
  finished: boolean;
};

export default function SimpleClickPage() {
  const [todoList, setTodoList] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  // 新增：加载状态、错误信息
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 从后端接口获取任务列表
  const fetchTodos = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error("获取任务失败");
      const data = await res.json();
      setTodoList(data);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时读取数据
  useEffect(() => {
    fetchTodos();
  }, []);

  // 添加待办
  const addTodo = async () => {
    if (text.trim() === "") return;
    setLoading(true);
    setErrorMsg("");
    try {
      await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: text }),
      });
      setText("");
      await fetchTodos();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 删除任务
  const deleteTodo = async (id: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });
      await fetchTodos();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 切换完成状态
  const toggleFinished = async (id: string, finished: boolean) => {
    setLoading(true);
    setErrorMsg("");
    try {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ finished: !finished }),
      });
      await fetchTodos();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 清空所有已完成
  const clearCompleted = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const completedIds = todoList.filter(item => item.finished).map(item => item.id);
      for (const id of completedIds) {
        await deleteTodo(id);
      }
      await fetchTodos();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  // 全部勾选 / 全部取消
  const toggleAll = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const hasUnfinished = todoList.some(item => !item.finished);
      for (const item of todoList) {
        await fetch(`/api/todos/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ finished: hasUnfinished }),
        });
      }
      await fetchTodos();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };


  // 双击进入编辑
  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditText(content);
  };

  // 保存编辑
  const saveEdit = async () => {
    if (editingId === null) return;
    const val = editText.trim();
    setLoading(true);
    setErrorMsg("");
    try {
      if (!val) {
        await deleteTodo(editingId);
      } else {
        await fetch(`/api/todos/${editingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: val }),
        });
        await fetchTodos();
      }
      setEditingId(null);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 筛选展示列表
  const showList = todoList.filter((item) => {
    if (filter === "active") return !item.finished;
    if (filter === "completed") return item.finished;
    return true;
  });

  return (
    <div className="p-8">
      <h1>待办清单 - 完善版</h1>
      {/* 错误提示 */}
      {errorMsg && <p className="text-red-500 my-2">❌ {errorMsg}</p>}

      <div className="mt-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border p-2 w-80"
          placeholder="输入待办事项..."
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          disabled={loading}
        />
        <button
          onClick={addTodo}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
          disabled={loading}
        >
          {loading ? "加载中..." : "添加"}
        </button>
      </div>

      <div className="mt-4">
        <p>总待办数量：{todoList.length}</p>
        <p>✅ 已完成：{todoList.filter((item) => item.finished).length}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => setFilter("all")} className="px-3 py-1 border rounded" disabled={loading}>全部</button>
        <button onClick={() => setFilter("active")} className="px-3 py-1 border rounded" disabled={loading}>未完成</button>
        <button onClick={() => setFilter("completed")} className="px-3 py-1 border rounded" disabled={loading}>已完成</button>
        <button onClick={clearCompleted} className="px-3 py-1 border rounded bg-gray-100" disabled={loading}>清空已完成</button>
        <button onClick={toggleAll} className="px-3 py-1 border rounded bg-gray-100" disabled={loading}>全部勾选 / 全部取消</button>
      </div>

      <ul className="mt-6">
        {showList.length === 0 && <li className="text-gray-500">暂无待办事项</li>}
        {showList.map((item) => {
          const isEditing = editingId === item.id;
          return (
            <li key={item.id} className="my-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.finished}
                onChange={() => toggleFinished(item.id, item.finished)}
                disabled={isEditing || loading}
              />
              {isEditing ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                  }}
                  onBlur={saveEdit}
                  className="border p-1"
                  disabled={loading}
                />
              ) : (
                <span
                  onDoubleClick={() => startEdit(item.id, item.content)}
                  style={{
                    textDecoration: item.finished ? "line-through" : "none",
                    color: item.finished ? "#888" : "#000",
                    cursor: "pointer",
                  }}
                >
                  {item.content}
                </span>
              )}
              <button
                onClick={() => deleteTodo(item.id)}
                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                disabled={isEditing || loading}
              >
                删除
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
