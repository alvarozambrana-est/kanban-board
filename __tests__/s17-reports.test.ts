import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import fs from "fs";
import { setDbPath, getDb, closeDb, createBoard, createColumn, createCard, createLabel, addLabelToCard, createUser, createCardType } from "../lib/db";
import { GET as exportBoard } from "../app/api/boards/[id]/export/route";

const TEST_DB = path.join(__dirname, "test-export.db");

describe("S17 - Reports (CSV/TSV export)", () => {
  beforeAll(() => {
    setDbPath(TEST_DB);
    getDb();
  });

  afterAll(() => {
    closeDb();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    if (fs.existsSync(TEST_DB + "-wal")) fs.unlinkSync(TEST_DB + "-wal");
    if (fs.existsSync(TEST_DB + "-shm")) fs.unlinkSync(TEST_DB + "-shm");
    setDbPath(path.join(process.cwd(), "data", "kanban.db"));
  });

  beforeEach(() => {
    const db = getDb();
    db.exec("DELETE FROM board_users");
    db.exec("DELETE FROM card_labels");
    db.exec("DELETE FROM labels");
    db.exec("DELETE FROM cards");
    db.exec("DELETE FROM columns");
    db.exec("DELETE FROM boards");
    db.exec("DELETE FROM users");
    db.exec("DELETE FROM card_types");
  });

  it("exports CSV with headers and data", async () => {
    const board = createBoard("My Board");
    const col = createColumn(board.id, "Todo");
    const type = createCardType("Bug");
    const user = createUser("Alice");
    const card = createCard(col.id, "Fix bug", "desc", "high", "2026-06-01", type.id, user.id, user.id);
    const label = createLabel("urgent", "#ff0000", board.id);
    addLabelToCard(card.id, label.id);

    const req = new Request("http://localhost/api/boards/1/export?format=csv");
    const res = await exportBoard(req, {
      params: Promise.resolve({ id: String(board.id) }),
    });

    expect(res.status).toBe(200);
    const text = await res.text();
    const lines = text.split("\n");
    expect(lines[0]).toContain("ID");
    expect(lines[0]).toContain("Title");
    expect(lines[0]).toContain("Priority");
    expect(lines[1]).toContain("Fix bug");
    expect(lines[1]).toContain("high");
    expect(lines[1]).toContain("Todo");
    expect(lines[1]).toContain("Bug");
    expect(lines[1]).toContain("Alice");
    expect(lines[1]).toContain("urgent");
    expect(res.headers.get("content-type")).toBe("text/csv");
    expect(res.headers.get("content-disposition")).toContain("board-1-export.csv");
  });

  it("exports TSV with tab delimiter", async () => {
    const board = createBoard("B");
    const col = createColumn(board.id, "Done");
    createCard(col.id, "Task");

    const req = new Request("http://localhost/api/boards/1/export?format=tsv");
    const res = await exportBoard(req, {
      params: Promise.resolve({ id: String(board.id) }),
    });

    const text = await res.text();
    const lines = text.split("\n");
    expect(lines[0]).toContain("\t");
    expect(res.headers.get("content-type")).toBe("text/tab-separated-values");
  });

  it("defaults to CSV when no format specified", async () => {
    const board = createBoard("B");
    const col = createColumn(board.id, "Todo");
    createCard(col.id, "Task");
    const req = new Request("http://localhost/api/boards/1/export");
    const res = await exportBoard(req, {
      params: Promise.resolve({ id: String(board.id) }),
    });
    expect(res.headers.get("content-type")).toBe("text/csv");
  });

  it("returns text for empty board", async () => {
    const board = createBoard("B");
    const req = new Request("http://localhost/api/boards/1/export");
    const res = await exportBoard(req, {
      params: Promise.resolve({ id: String(board.id) }),
    });
    const text = await res.text();
    expect(text).toBe("No cards to export");
  });

  it("escapes CSV fields with commas", async () => {
    const board = createBoard("B");
    const col = createColumn(board.id, "Todo");
    createCard(col.id, "Task with, comma");
    const req = new Request("http://localhost/api/boards/1/export?format=csv");
    const res = await exportBoard(req, {
      params: Promise.resolve({ id: String(board.id) }),
    });
    const text = await res.text();
    expect(text).toContain('"Task with, comma"');
  });
});
