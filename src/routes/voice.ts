import { createToken } from "../services/voice";
import { getUser } from "./auth";

const LIVEKIT_PORT = process.env.LIVEKIT_PORT || "7880";

export async function token(req: Request) {
  const user = getUser(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { room } = await req.json();
  if (!room) return new Response("Room name is required", { status: 400 });

  const jwt = await createToken(room, user.name);
  const host = req.headers.get("host")?.split(":")[0] || "localhost";
  const livekitUrl = `ws://${host}:${LIVEKIT_PORT}`;
  return Response.json({ token: jwt, livekitUrl });
}
