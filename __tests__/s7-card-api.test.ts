import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import fs from "fs";
import { setDbPath, getDb, closeDb, createBoard, createColumn, createCard, getCardsByBoard } from "../lib/db";
import {
  GET as listCards,
  POST as createCardHandler,
} from "../app/api/boards/[id]/cards/route";
import {
  PUT as updateCard,
  DELETE as deleteCard,
} from "../app/api/cards/[id]/route";
import { PUT as moveCard } from "../app/api/cards/reorder/route";

const TEST_DB = path.join(__dirname, "test-card-api.db");

describe("S7 - Card API", () => {
  let boardId: number;
  let columnId: number;

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
    db.exec("DELETE FROM card_labels");
    db.exec("DELETE FROM labels");
    db.exec("DELETE FROM cards");
    db.exec("DELETE FROM columns");
    db.exec("DELETE FROM boards");
    boardId = createBoard("Test Board").id;
    columnId = createColumn(boardId, "Todo").id;
  });

  describe("GET /api/boards/[id]/cards", () => {
    it("returns empty array when no cards", async () => {
      const res = await listCards(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("returns all cards for a board", async () => {
      createCard(columnId, "Task 1");
      createCard(columnId, "Task 2");
      const col2 = createColumn(boardId, "Done");
      createCard(col2.id, "Task 3");
      const res = await listCards(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(data).toHaveLength(3);
    });
  });

  describe("POST /api/boards/[id]/cards", () => {
    it("creates a card", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          column_id: columnId,
          title: "New Task",
          description: "Desc",
          priority: "high",
          due_date: "2026-06-01",
        }),
      });
      const res = await createCardHandler(req, {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.title).toBe("New Task");
      expect(data.priority).toBe("high");
      expect(data.due_date).toBe("2026-06-01");
    });

    it("defaults priority to medium", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ column_id: columnId, title: "Task" }),
      });
      const res = await createCardHandler(req, {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(data.priority).toBe("medium");
    });

    it("rejects missing column_id", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ title: "Task" }),
      });
      const res = await createCardHandler(req, {
        params: Promise.resolve({ id: String(boardId) }),
      });
      expect(res.status).toBe(400);
    });

    it("rejects empty title", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ column_id: columnId, title: "" }),
      });
      const res = await createCardHandler(req, {
        params: Promise.resolve({ id: String(boardId) }),
      });
      expect(res.status).toBe(400);
    });

    it("accepts invalid priority as medium", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ column_id: columnId, title: "Task", priority: "urgent" }),
      });
      const res = await createCardHandler(req, {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(data.priority).toBe("medium");
    });
  });

  describe("PUT /api/cards/[id]", () => {
    it("updates a card", async () => {
      const card = createCard(columnId, "Old");
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ title: "New", priority: "high" }),
      });
      const res = await updateCard(req, {
        params: Promise.resolve({ id: String(card.id) }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.title).toBe("New");
      expect(data.priority).toBe("high");
    });

    it("rejects invalid priority on update", async () => {
      const card = createCard(columnId, "Task");
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ priority: "urgent" }),
      });
      const res = await updateCard(req, {
        params: Promise.resolve({ id: String(card.id) }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 404 for non-existent card", async () => {
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ title: "X" }),
      });
      const res = await updateCard(req, {
        params: Promise.resolve({ id: "999" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/cards/[id]", () => {
    it("deletes a card", async () => {
      const card = createCard(columnId, "Task");
      const res = await deleteCard(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(card.id) }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe("PUT /api/cards/reorder", () => {
    it("moves a card to another column", async () => {
      const col2 = createColumn(boardId, "Done");
      const card = createCard(columnId, "Task");
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ cardId: card.id, toColumnId: col2.id, toPosition: 0 }),
      });
      const res = await moveCard(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.column_id).toBe(col2.id);
    });

    it("returns 404 for non-existent card", async () => {
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ cardId: 999, toColumnId: columnId, toPosition: 0 }),
      });
      const res = await moveCard(req);
      expect(res.status).toBe(404);
    });

    it("rejects missing fields", async () => {
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ cardId: 1 }),
      });
      const res = await moveCard(req);
      expect(res.status).toBe(400);
    });
  });
});
