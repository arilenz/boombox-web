import * as soundsService from "../services/sounds";
import { getUser } from "./auth";

export async function serveSoundFile(req: Request) {
  const url = new URL(req.url);
  const filename = url.pathname.replace("/sounds/", "");
  const file = await soundsService.getFile(filename);
  if (file) return new Response(file);
  return new Response("Not found", { status: 404 });
}

export async function handleSounds(req: Request) {
  if (req.method === "GET") {
    return Response.json(soundsService.list());
  }

  if (req.method === "POST") {
    const user = getUser(req);
    if (!user) return new Response("Unauthorized", { status: 401 });

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const file = formData.get("file") as File;

    if (!name || !file) {
      return new Response("Name and file are required", { status: 400 });
    }

    const sounds = await soundsService.upload(name, file, user.id);
    return Response.json(sounds);
  }

  return new Response("Method not allowed", { status: 405 });
}

export async function handleDeleteSound(req: Request) {
  if (req.method !== "DELETE") return new Response("Method not allowed", { status: 405 });

  const user = getUser(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.pathname.split("/").pop());

  try {
    const sounds = await soundsService.remove(id, user.id);
    return Response.json(sounds);
  } catch (e: any) {
    const status = e.message === "Not your sound" ? 403 : 404;
    return new Response(e.message, { status });
  }
}
