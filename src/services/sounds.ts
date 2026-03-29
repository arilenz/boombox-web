import { join } from "node:path";
import { unlink } from "node:fs/promises";
import { addSound, getAllSounds, getSound, deleteSound } from "../db";

const SOUNDS_DIR = join(import.meta.dir, "../../sounds");

export function list() {
  return getAllSounds();
}

export async function upload(name: string, file: File, userId: number) {
  const ext = file.name.split(".").pop();
  const filename = `${crypto.randomUUID()}.${ext}`;
  await Bun.write(join(SOUNDS_DIR, filename), file);
  addSound(name.trim(), filename, userId);
  return getAllSounds();
}

export async function remove(soundId: number, userId: number) {
  const sound = getSound(soundId);
  if (!sound) throw new Error("Sound not found");
  if (sound.uploaded_by !== userId) throw new Error("Not your sound");

  await unlink(join(SOUNDS_DIR, sound.filename)).catch(() => {});
  deleteSound(soundId);
  return getAllSounds();
}

export async function getFile(filename: string) {
  const file = Bun.file(join(SOUNDS_DIR, filename));
  if (await file.exists()) return file;
  return null;
}
