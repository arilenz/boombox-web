import { serve } from "bun";
import index from "./app/index.html";
import { signup, login, logout, me } from "./routes/auth";
import { serveSoundFile, handleSounds, handleDeleteSound } from "./routes/sounds";
import { upgrade } from "./routes/realtime";
import { websocket } from "./services/realtime";
import type { WsData } from "./services/realtime";

const server = serve<WsData>({
  routes: {
    "/*": index,
    "/sounds/*": serveSoundFile,
    "/api/signup": signup,
    "/api/login": login,
    "/api/logout": logout,
    "/api/me": me,
    "/api/sounds": handleSounds,
    "/api/sounds/*": handleDeleteSound,
    "/ws": (req, server) => upgrade(req, server),
  },
  websocket,
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
  },
});

console.log(`Server running at ${server.url}`);
