import { serve } from "bun";
import { join } from "node:path";
import { unlink } from "node:fs/promises";
import index from "./app/index.html";
import {
  createUser, getUserByEmail, createSession, getUserByToken, deleteSession,
  addSound, getAllSounds, getSound, deleteSound,
} from "./db";

type WsData = { name: string };

const SOUNDS_DIR = join(import.meta.dir, "../sounds");

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function getToken(req: Request): string | null {
  return req.headers.get("authorization")?.replace("Bearer ", "") ?? null;
}

function getUser(req: Request) {
  const token = getToken(req);
  if (!token) return null;
  return getUserByToken(token);
}

const server = serve<WsData>({
  routes: {
    "/*": index,

    "/sounds/*": async (req) => {
      const url = new URL(req.url);
      const filename = url.pathname.replace("/sounds/", "");
      const file = Bun.file(join(SOUNDS_DIR, filename));
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response("Not found", { status: 404 });
    },

    "/api/signup": async (req) => {
      if (req.method !== "POST") return jsonError("Method not allowed", 405);
      const { email, password, name } = await req.json();

      if (!email || !password || !name) {
        return jsonError("Email, password, and name are required");
      }

      if (getUserByEmail(email)) {
        return jsonError("Email already taken");
      }

      const passwordHash = await Bun.password.hash(password);
      createUser(email, passwordHash, name);
      const user = getUserByEmail(email)!;
      const token = createSession(user.id);

      return Response.json({ token, name: user.name });
    },

    "/api/login": async (req) => {
      if (req.method !== "POST") return jsonError("Method not allowed", 405);
      const { email, password } = await req.json();

      if (!email || !password) {
        return jsonError("Email and password are required");
      }

      const user = getUserByEmail(email);
      if (!user) {
        return jsonError("Invalid email or password", 401);
      }

      const valid = await Bun.password.verify(password, user.password_hash);
      if (!valid) {
        return jsonError("Invalid email or password", 401);
      }

      const token = createSession(user.id);
      return Response.json({ token, name: user.name });
    },

    "/api/logout": (req) => {
      if (req.method !== "POST") return jsonError("Method not allowed", 405);
      const token = getToken(req);
      if (token) deleteSession(token);
      return Response.json({ ok: true });
    },

    "/api/me": (req) => {
      const user = getUser(req);
      if (!user) return jsonError("Unauthorized", 401);
      return Response.json({ name: user.name, email: user.email });
    },

    "/api/sounds": async (req) => {
      if (req.method === "GET") {
        return Response.json(getAllSounds());
      }

      if (req.method === "POST") {
        const user = getUser(req);
        if (!user) return jsonError("Unauthorized", 401);

        const formData = await req.formData();
        const name = formData.get("name") as string;
        const file = formData.get("file") as File;

        if (!name || !file) {
          return jsonError("Name and file are required");
        }

        const ext = file.name.split(".").pop();
        const filename = `${crypto.randomUUID()}.${ext}`;
        await Bun.write(join(SOUNDS_DIR, filename), file);
        addSound(name.trim(), filename, user.id);

        return Response.json(getAllSounds());
      }

      return jsonError("Method not allowed", 405);
    },

    "/api/sounds/*": async (req) => {
      if (req.method !== "DELETE") return jsonError("Method not allowed", 405);

      const user = getUser(req);
      if (!user) return jsonError("Unauthorized", 401);

      const url = new URL(req.url);
      const id = Number(url.pathname.split("/").pop());
      const sound = getSound(id);
      if (!sound) return jsonError("Sound not found", 404);
      if (sound.uploaded_by !== user.id) return jsonError("Not your sound", 403);

      await unlink(join(SOUNDS_DIR, sound.filename)).catch(() => {});
      deleteSound(id);

      return Response.json(getAllSounds());
    },

    "/ws": (req, server) => {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");
      if (!token) return jsonError("Token required", 401);

      const user = getUserByToken(token);
      if (!user) return jsonError("Invalid token", 401);

      if (server.upgrade(req, { data: { name: user.name } })) {
        return;
      }
      return new Response("Upgrade failed", { status: 500 });
    },
  },

  websocket: {
    open(ws) {
      ws.subscribe("chat");
      ws.publish("chat", JSON.stringify({ type: "system", text: `${ws.data.name} joined` }));
    },
    message(ws, message) {
      const parsed = JSON.parse(String(message));
      if (parsed.type === "play") {
        const event = JSON.stringify({ type: "play", sound: parsed.sound, from: ws.data.name });
        ws.publish("chat", event);
        ws.send(event);
      }
    },
    close(ws) {
      ws.publish("chat", JSON.stringify({ type: "system", text: `${ws.data.name} left` }));
      ws.unsubscribe("chat");
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
  },
});

console.log(`Server running at ${server.url}`);
