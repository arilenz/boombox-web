import type { ServerWebSocket } from "bun";
import { authenticate } from "./auth";

export type WsData = { name: string };

export function authenticateWs(token: string) {
  const user = authenticate(token);
  return { name: user.name };
}

export const websocket = {
  open(ws: ServerWebSocket<WsData>) {
    ws.subscribe("chat");
    ws.publish("chat", JSON.stringify({ type: "system", text: `${ws.data.name} joined` }));
  },
  message(ws: ServerWebSocket<WsData>, message: string | Buffer) {
    const parsed = JSON.parse(String(message));
    if (parsed.type === "play") {
      const event = JSON.stringify({ type: "play", sound: parsed.sound, from: ws.data.name });
      ws.publish("chat", event);
      ws.send(event);
    }
  },
  close(ws: ServerWebSocket<WsData>) {
    ws.publish("chat", JSON.stringify({ type: "system", text: `${ws.data.name} left` }));
    ws.unsubscribe("chat");
  },
};
