'use client';
import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type TodoItem = {
  id: string;
  content: string;
  finished: boolean;
  createdAt: string;
};

function SortableTodoItem({
  item,
  onToggle,
  onDelete,
  onEdit
}: {
  item: TodoItem;
  onToggle: (id: string, finished: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.content);

  const saveEdit = () => {
    onEdit(item.id, editText);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-md"
    >
      <input
        type="checkbox"
        checked={item.finished}
        onChange={(e) => {
          e.stopPropagation();
          onToggle(item.id, !item.finished);
        }}
        className="w-4 h-4 cursor-pointer accent-gray-700"
      />

      {isEditing ? (
        <>
          <input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
          />
          <button
            onClick={saveEdit}
            onPointerDown={(e) => e.stopPropagation()}
            className="px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            保存
          </button>
        </>
      ) : (
        <span
          className={`flex-1 text-sm ${item.finished ? 'line-through text-gray-400' : 'text-gray-800'}`}
        >
          {item.content}
        </span>
      )}

      <button
        onClick={() => setIsEditing(true)}
        onPointerDown={(e) => e.stopPropagation()}
        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
      >
        编辑
      </button>
      <button
        onClick={() => onDelete(item.id)}
        onPointerDown={(e) => e.stopPropagation()}
        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
      >
        删除
      </button>
    </div>
  );
}

export default function TodoPage() {
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unfinished' | 'finished'>('all');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const fetchTodos = async () => {
    setLoading(true);
    const res = await fetch('/api/todos');
    const data = await res.json();
    setTodoList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTodo = async () => {
    if (!inputText.trim()) return;
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: inputText })
    });
    setInputText('');
    fetchTodos();
  };

  const toggleTodo = async (id: string, finished: boolean) => {
    await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, finished })
    });
    fetchTodos();
  };

  const editTodo = async (id: string, content: string) => {
    await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content })
    });
    fetchTodos();
  };

  const deleteTodo = async (id: string) => {
    await fetch('/api/todos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchTodos();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = todoList.findIndex(item => item.id === active.id);
    const newIndex = todoList.findIndex(item => item.id === over.id);
    const newList = [...todoList];
    const [removed] = newList.splice(oldIndex, 1);
    newList.splice(newIndex, 0, removed);
    setTodoList(newList);

    // 把新顺序保存到数据库（sortOrder 数字越小越靠上）
    const dataToSave = newList.map((item, idx) => ({
      id: item.id,
      sortOrder: idx
    }));
    await fetch('/api/todos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave)
    });
  };

  const filteredList = todoList.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'unfinished') return !item.finished;
    return item.finished;
  });

  const clearFinished = async () => {
    const finishedItems = todoList.filter(x => x.finished);
    for (const item of finishedItems) {
      await deleteTodo(item.id);
    }
  };

  if (loading) return <div className="text-center mt-10 text-sm text-gray-500">加载中...</div>;

  return (
    <div className="bg-white py-10">
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-1">待办事项清单</h2>
        <p className="text-center text-xs text-gray-500 mb-6">
          总任务：{todoList.length}｜已完成：{todoList.filter(x => x.finished).length}
        </p>

        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm border rounded ${
              filter === 'all'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('unfinished')}
            className={`px-3 py-1 text-sm border rounded ${
              filter === 'unfinished'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            未完成
          </button>
          <button
            onClick={() => setFilter('finished')}
            className={`px-3 py-1 text-sm border rounded ${
              filter === 'finished'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            已完成
          </button>
          <button
            onClick={clearFinished}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            清除已完成
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="输入新任务..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
          />
          <button
            onClick={addTodo}
            className="px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            添加任务
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredList.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filteredList.map(item => (
                <SortableTodoItem
                  key={item.id}
                  item={item}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={editTodo}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {filteredList.length === 0 && (
          <div className="text-center text-sm text-gray-400 mt-10">暂无任务</div>
        )}
      </div>
    </div>
  );
}
