import { Database } from "bun:sqlite";

const db = new Database("sound-chat.db");

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

export function createUser(email: string, passwordHash: string, name: string) {
  return db.run(
    "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
    [email, passwordHash, name]
  );
}

export function getUserByEmail(email: string) {
  return db.query("SELECT * FROM users WHERE email = ?").get(email) as
    | { id: number; email: string; password_hash: string; name: string }
    | null;
}

export function createSession(userId: number): string {
  const token = crypto.randomUUID();
  db.run("INSERT INTO sessions (token, user_id) VALUES (?, ?)", [token, userId]);
  return token;
}

export function getUserByToken(token: string) {
  return db
    .query(
      "SELECT users.id, users.email, users.name FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?"
    )
    .get(token) as { id: number; email: string; name: string } | null;
}

export function deleteSession(token: string) {
  db.run("DELETE FROM sessions WHERE token = ?", [token]);
}

// Sounds

db.run(`
  CREATE TABLE IF NOT EXISTS sounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    filename TEXT UNIQUE NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

export function addSound(name: string, filename: string, uploadedBy: number) {
  db.run(
    "INSERT INTO sounds (name, filename, uploaded_by) VALUES (?, ?, ?)",
    [name, filename, uploadedBy]
  );
}

export function getAllSounds() {
  return db
    .query(
      "SELECT sounds.id, sounds.name, sounds.filename, users.name as uploaded_by FROM sounds JOIN users ON users.id = sounds.uploaded_by ORDER BY sounds.created_at DESC"
    )
    .all() as { id: number; name: string; filename: string; uploaded_by: string }[];
}

export function getSound(id: number) {
  return db.query("SELECT * FROM sounds WHERE id = ?").get(id) as
    | { id: number; name: string; filename: string; uploaded_by: number }
    | null;
}

export function deleteSound(id: number) {
  db.run("DELETE FROM sounds WHERE id = ?", [id]);
}
