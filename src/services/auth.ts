import { createUser, getUserByEmail, createSession, getUserByToken, deleteSession } from "../db";

export async function signup(email: string, password: string, name: string) {
  if (getUserByEmail(email)) {
    throw new Error("Email already taken");
  }

  const passwordHash = await Bun.password.hash(password);
  createUser(email, passwordHash, name);
  const user = getUserByEmail(email)!;
  const token = createSession(user.id);

  return { token, name: user.name };
}

export async function login(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user) throw new Error("Invalid email or password");

  const valid = await Bun.password.verify(password, user.password_hash);
  if (!valid) throw new Error("Invalid email or password");

  const token = createSession(user.id);
  return { token, name: user.name };
}

export function logout(token: string) {
  deleteSession(token);
}

export function authenticate(token: string) {
  const user = getUserByToken(token);
  if (!user) throw new Error("Unauthorized");
  return user;
}
