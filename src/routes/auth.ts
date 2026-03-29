import * as authService from "../services/auth";

function getToken(req: Request): string | null {
  return req.headers.get("authorization")?.replace("Bearer ", "") ?? null;
}

export function getUser(req: Request) {
  const token = getToken(req);
  if (!token) return null;
  try {
    return authService.authenticate(token);
  } catch {
    return null;
  }
}

export async function signup(req: Request) {
  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return new Response("Email, password, and name are required", { status: 400 });
  }

  try {
    const result = await authService.signup(email, password, name);
    return Response.json(result);
  } catch (e: any) {
    return new Response(e.message, { status: 400 });
  }
}

export async function login(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return new Response("Email and password are required", { status: 400 });
  }

  try {
    const result = await authService.login(email, password);
    return Response.json(result);
  } catch (e: any) {
    return new Response(e.message, { status: 401 });
  }
}

export function logout(req: Request) {
  const token = getToken(req);
  if (token) authService.logout(token);
  return Response.json({ ok: true });
}

export function me(req: Request) {
  const user = getUser(req);
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json({ name: user.name, email: user.email });
}
