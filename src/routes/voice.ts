import { createToken } from "../services/voice";
import { getUser } from "./auth";

export async function token(req: Request) {
  const user = getUser(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { room } = await req.json();
  if (!room) return new Response("Room name is required", { status: 400 });

  const jwt = await createToken(room, user.name);
  return Response.json({ token: jwt });
}
