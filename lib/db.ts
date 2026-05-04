import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "kanban.db");

let db: Database.Database | null = null;
let dbPath = DEFAULT_DB_PATH;

export function setDbPath(customPath: string): void {
  dbPath = customPath;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS columns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  priority TEXT CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS labels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS card_labels (
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

PRAGMA foreign_keys = ON;
`;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.exec(SCHEMA_SQL);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/* ---------- Board helpers ---------- */

export interface Board {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export function getAllBoards(): Board[] {
  return getDb().prepare("SELECT * FROM boards ORDER BY created_at DESC").all() as Board[];
}

export function getBoardById(id: number): Board | undefined {
  return getDb().prepare("SELECT * FROM boards WHERE id = ?").get(id) as Board | undefined;
}

export function createBoard(name: string): Board {
  const stmt = getDb().prepare("INSERT INTO boards (name) VALUES (?)");
  const result = stmt.run(name);
  return getBoardById(result.lastInsertRowid as number)!;
}

export function updateBoard(id: number, name: string): Board | undefined {
  const stmt = getDb().prepare("UPDATE boards SET name = ?, updated_at = datetime('now') WHERE id = ?");
  stmt.run(name, id);
  return getBoardById(id);
}

export function deleteBoard(id: number): boolean {
  const result = getDb().prepare("DELETE FROM boards WHERE id = ?").run(id);
  return result.changes > 0;
}

/* ---------- Column helpers ---------- */

export interface Column {
  id: number;
  board_id: number;
  name: string;
  position: number;
}

export function getColumnsByBoard(boardId: number): Column[] {
  return getDb()
    .prepare("SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC")
    .all(boardId) as Column[];
}

export function getColumnById(id: number): Column | undefined {
  return getDb().prepare("SELECT * FROM columns WHERE id = ?").get(id) as Column | undefined;
}

export function createColumn(boardId: number, name: string): Column {
  const maxPos = getDb()
    .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM columns WHERE board_id = ?")
    .get(boardId) as { next: number };
  const stmt = getDb().prepare("INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)");
  const result = stmt.run(boardId, name, maxPos.next);
  return getColumnById(result.lastInsertRowid as number)!;
}

export function updateColumn(id: number, name: string): Column | undefined {
  getDb().prepare("UPDATE columns SET name = ? WHERE id = ?").run(name, id);
  return getColumnById(id);
}

export function deleteColumn(id: number): boolean {
  const result = getDb().prepare("DELETE FROM columns WHERE id = ?").run(id);
  return result.changes > 0;
}

export function reorderColumns(orderedIds: number[]): void {
  const stmt = getDb().prepare("UPDATE columns SET position = ? WHERE id = ?");
  const tx = getDb().transaction((ids: number[]) => {
    ids.forEach((id, index) => stmt.run(index, id));
  });
  tx(orderedIds);
}

/* ---------- Card helpers ---------- */

export interface Card {
  id: number;
  column_id: number;
  title: string;
  description: string;
  position: number;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export function getCardsByBoard(boardId: number): Card[] {
  return getDb()
    .prepare(
      `SELECT c.* FROM cards c
       JOIN columns col ON c.column_id = col.id
       WHERE col.board_id = ?
       ORDER BY c.position ASC`
    )
    .all(boardId) as Card[];
}

export function getCardsByColumn(columnId: number): Card[] {
  return getDb()
    .prepare("SELECT * FROM cards WHERE column_id = ? ORDER BY position ASC")
    .all(columnId) as Card[];
}

export function getCardById(id: number): Card | undefined {
  return getDb().prepare("SELECT * FROM cards WHERE id = ?").get(id) as Card | undefined;
}

export function createCard(
  columnId: number,
  title: string,
  description = "",
  priority: "low" | "medium" | "high" = "medium",
  dueDate: string | null = null
): Card {
  const maxPos = getDb()
    .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM cards WHERE column_id = ?")
    .get(columnId) as { next: number };
  const stmt = getDb().prepare(
    "INSERT INTO cards (column_id, title, description, position, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(columnId, title, description, maxPos.next, priority, dueDate);
  return getCardById(result.lastInsertRowid as number)!;
}

export function updateCard(
  id: number,
  data: Partial<Pick<Card, "title" | "description" | "priority" | "due_date" | "column_id" | "position">>
): Card | undefined {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) { fields.push("title = ?"); values.push(data.title); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
  if (data.priority !== undefined) { fields.push("priority = ?"); values.push(data.priority); }
  if (data.due_date !== undefined) { fields.push("due_date = ?"); values.push(data.due_date); }
  if (data.column_id !== undefined) { fields.push("column_id = ?"); values.push(data.column_id); }
  if (data.position !== undefined) { fields.push("position = ?"); values.push(data.position); }

  if (fields.length === 0) return getCardById(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);

  getDb()
    .prepare(`UPDATE cards SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);

  return getCardById(id);
}

export function deleteCard(id: number): boolean {
  const result = getDb().prepare("DELETE FROM cards WHERE id = ?").run(id);
  return result.changes > 0;
}

export function moveCard(cardId: number, toColumnId: number, toPosition: number): Card | undefined {
  const card = getCardById(cardId);
  if (!card) return undefined;

  const tx = getDb().transaction(() => {
    if (card.column_id !== toColumnId) {
      getDb()
        .prepare("UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?")
        .run(card.column_id, card.position);
      getDb()
        .prepare("UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ?")
        .run(toColumnId, toPosition);
    } else {
      if (card.position < toPosition) {
        getDb()
          .prepare("UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ? AND position <= ?")
          .run(card.column_id, card.position, toPosition);
      } else if (card.position > toPosition) {
        getDb()
          .prepare("UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ? AND position < ?")
          .run(card.column_id, toPosition, card.position);
      }
    }
    getDb()
      .prepare("UPDATE cards SET column_id = ?, position = ?, updated_at = datetime('now') WHERE id = ?")
      .run(toColumnId, toPosition, cardId);
  });
  tx();
  return getCardById(cardId);
}

/* ---------- Label helpers ---------- */

export interface Label {
  id: number;
  name: string;
  color: string;
}

export function getAllLabels(): Label[] {
  return getDb().prepare("SELECT * FROM labels ORDER BY id ASC").all() as Label[];
}

export function getLabelById(id: number): Label | undefined {
  return getDb().prepare("SELECT * FROM labels WHERE id = ?").get(id) as Label | undefined;
}

export function createLabel(name: string, color = "#6366f1"): Label {
  const result = getDb().prepare("INSERT INTO labels (name, color) VALUES (?, ?)").run(name, color);
  return getLabelById(result.lastInsertRowid as number)!;
}

export function updateLabel(id: number, name: string, color: string): Label | undefined {
  getDb().prepare("UPDATE labels SET name = ?, color = ? WHERE id = ?").run(name, color, id);
  return getLabelById(id);
}

export function deleteLabel(id: number): boolean {
  const result = getDb().prepare("DELETE FROM labels WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getCardLabels(cardId: number): Label[] {
  return getDb()
    .prepare(
      "SELECT l.* FROM labels l JOIN card_labels cl ON l.id = cl.label_id WHERE cl.card_id = ?"
    )
    .all(cardId) as Label[];
}

export function addLabelToCard(cardId: number, labelId: number): void {
  getDb()
    .prepare("INSERT OR IGNORE INTO card_labels (card_id, label_id) VALUES (?, ?)")
    .run(cardId, labelId);
}

export function removeLabelFromCard(cardId: number, labelId: number): void {
  getDb()
    .prepare("DELETE FROM card_labels WHERE card_id = ? AND label_id = ?")
    .run(cardId, labelId);
}
