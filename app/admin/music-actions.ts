"use server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

// 发布新歌：管理员填表单 → 存进 Song 表
export async function createSong(formData: FormData) {
  // 1. 管理员检查（老规矩）
  if (!(await isAdmin())) return;

  // 2. 从"袋子"里拿表单值
  const title = String(formData.get("title") || "").trim();
  const genre = String(formData.get("genre") || "未分类").trim();
  const cover = String(formData.get("cover") || "").trim() || null;
  const audioUrl = String(formData.get("audioUrl") || "").trim();
  const lyrics = String(formData.get("lyrics") || "").trim() || null;
  const isOriginal = formData.get("isOriginal") === "on"; // 勾选框：勾了才是 true

  // 3. 必填检查：歌名和音频必须有（表单有 required 挡着，这里双保险）
  if (!title || !audioUrl) return;

  // 4. 写入数据库（prisma.song 就是第 2 步建的 Song 表）
  await prisma.song.create({
    data: { title, genre, cover, audioUrl, lyrics, isOriginal },
  });

  // 5. 刷新后台页面
  revalidatePath("/admin");
}

// 删除歌曲
export async function deleteSong(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.song.delete({ where: { id } });
  revalidatePath("/admin");
}

// 编辑歌曲：改歌名/风格/封面/音频/歌词/原创标记/排序
export async function updateSong(formData: FormData) {
  // 1. 管理员检查（老规矩）
  if (!(await isAdmin())) return;

  // 2. 拿表单值
  const id = String(formData.get("id") || "");
  if (!id) return;
  const title = String(formData.get("title") || "").trim();
  const genre = String(formData.get("genre") || "未分类").trim();
  const cover = String(formData.get("cover") || "").trim() || null;
  const audioUrl = String(formData.get("audioUrl") || "").trim();
  const lyrics = String(formData.get("lyrics") || "").trim() || null;
  const isOriginal = formData.get("isOriginal") === "on"; // 勾选框：勾了才是 true
  const sortOrder = Number(formData.get("sortOrder") || 0);

  // 3. 必填检查：歌名和音频必须有
  if (!title || !audioUrl) return;

  // 4. 更新数据库（只改这一条）
  await prisma.song.update({
    where: { id },
    data: {
      title,
      genre,
      cover,
      audioUrl,
      lyrics,
      isOriginal,
      sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
    },
  });

  // 5. 刷新后台 + 音乐馆（改完前台马上看到）
  revalidatePath("/admin");
  revalidatePath("/music");
}

// 上架/下架：published=前台可见 / hidden=前台隐藏（后台仍能看到）
export async function toggleSongStatus(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  const song = await prisma.song.findUnique({ where: { id } });
  if (!song) return;
  await prisma.song.update({
    where: { id },
    data: { status: song.status === "published" ? "hidden" : "published" },
  });
  revalidatePath("/admin");
  revalidatePath("/music");
}
