"use client";
import { useState } from "react";
import { updateMessage } from "./actions";

type MsgItem = {
  id: string;
  content: string;
};

export default function EditBtn({ msg }: { msg: MsgItem }) {
  const [isEdit, setIsEdit] = useState(false);
  const [text, setText] = useState(msg.content);

  async function handleSave() {
    await updateMessage(msg.id, text);
    setIsEdit(false);
  }

  if (!isEdit) {
    return (
      <button
        onClick={() => setIsEdit(true)}
        style={{ color: "blue", marginRight: "8px" }}
      >
        编辑
      </button>
    );
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "300px" }}
      />
      <br />
      <button onClick={handleSave} style={{ color: "green", marginRight: "8px" }}>
        保存
      </button>
      <button onClick={() => setIsEdit(false)} style={{ color: "gray" }}>
        取消
      </button>
    </div>
  );
}
