import { authenticateWs } from "../services/realtime";
import type { WsData } from "../services/realtime";

export function upgrade(req: Request, server: { upgrade: (req: Request, options: { data: WsData }) => boolean }) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response("Token required", { status: 401 });

  try {
    const data = authenticateWs(token);
    if (server.upgrade(req, { data })) return;
    return new Response("Upgrade failed", { status: 500 });
  } catch {
    return new Response("Invalid token", { status: 401 });
  }
}
