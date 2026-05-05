import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import fs from "fs";
import { setDbPath, getDb, closeDb, createBoard, createColumn, createCard, createCardType, createUser } from "../lib/db";
import { GET as search } from "../app/api/search/route";

const TEST_DB = path.join(__dirname, "test-search.db");

describe("S16 - Search", () => {
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

  it("returns all cards when no filters", async () => {
    const board = createBoard("B");
    const col = createColumn(board.id, "Todo");
    createCard(col.id, "Task 1");
    createCard(col.id, "Task 2");
    const res = await search(new Request("http://localhost/api/search"));
    const data = await res.json();
    expect(data).toHaveLength(2);
  });

  it("filters by text query", async () => {
    const board = createBoard("B");
    const col = createColumn(board.id, "Todo");
    createCard(col.id, "Setup CI", "Configure pipelines");
    createCard(col.id, "Write docs");
    const res = await search(new Request("http://localhost/api/search?q=CI"));
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Setup CI");
  });

  it("filters by board_id", async () => {
    const b1 = createBoard("B1");
    const b2 = createBoard("B2");
    const c1 = createColumn(b1.id, "Todo");
    const c2 = createColumn(b2.id, "Todo");
    createCard(c1.id, "A");
    createCard(c2.id, "B");
    const res = await search(new Request(`http://localhost/api/search?board_id=${b1.id}`));
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("A");
  });

  it("filters by priority", async () => {
    const board = createBoard("B");
    const col = createColumn(board.id, "Todo");
    createCard(col.id, "High task", "", "high");
    createCard(col.id, "Low task", "", "low");
    const res = await search(new Request("http://localhost/api/search?priority=high"));
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].priority).toBe("high");
  });

  it("filters by assignee", async () => {
    const user = createUser("Alice");
    const board = createBoard("B");
    const col = createColumn(board.id, "Todo");
    createCard(col.id, "Assigned", "", "medium", null, undefined, undefined, user.id);
    createCard(col.id, "Unassigned");
    const res = await search(new Request(`http://localhost/api/search?assignee_id=${user.id}`));
    const data = await res.json();
    expect(data).toHaveLength(1);
  });

  it("filters by type", async () => {
    const type = createCardType("Bug");
    const board = createBoard("B");
    const col = createColumn(board.id, "Todo");
    createCard(col.id, "Bug card", "", "medium", null, type.id);
    createCard(col.id, "No type");
    const res = await search(new Request(`http://localhost/api/search?type_id=${type.id}`));
    const data = await res.json();
    expect(data).toHaveLength(1);
  });

  it("combines multiple filters", async () => {
    const type = createCardType("Bug");
    const user = createUser("Alice");
    const board = createBoard("B");
    const col = createColumn(board.id, "Todo");
    createCard(col.id, "Fix login", "", "high", null, type.id, undefined, user.id);
    createCard(col.id, "Other bug", "", "medium", null, type.id);
    const res = await search(new Request(
      `http://localhost/api/search?type_id=${type.id}&priority=high&assignee_id=${user.id}`
    ));
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Fix login");
  });
});
