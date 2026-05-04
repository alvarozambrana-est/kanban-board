import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import fs from "fs";
import { setDbPath, getDb, closeDb, createBoard, createColumn, getColumnsByBoard } from "../lib/db";
import {
  GET as listColumns,
  POST as createColumnHandler,
} from "../app/api/boards/[id]/columns/route";
import {
  PUT as updateColumn,
  DELETE as deleteColumn,
} from "../app/api/columns/[id]/route";
import { PUT as reorderColumns } from "../app/api/columns/reorder/route";

const TEST_DB = path.join(__dirname, "test-column-api.db");

describe("S5 - Column API", () => {
  let boardId: number;

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
  });

  describe("GET /api/boards/[id]/columns", () => {
    it("returns empty array for board with no columns", async () => {
      const res = await listColumns(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("returns columns for a board", async () => {
      createColumn(boardId, "Todo");
      createColumn(boardId, "Done");
      const res = await listColumns(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe("Todo");
      expect(data[1].name).toBe("Done");
    });
  });

  describe("POST /api/boards/[id]/columns", () => {
    it("creates a column", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "In Progress" }),
      });
      const res = await createColumnHandler(req, {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe("In Progress");
      expect(data.board_id).toBe(boardId);
    });

    it("rejects empty name", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      });
      const res = await createColumnHandler(req, {
        params: Promise.resolve({ id: String(boardId) }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/columns/[id]", () => {
    it("updates a column name", async () => {
      const col = createColumn(boardId, "Old");
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ name: "New" }),
      });
      const res = await updateColumn(req, {
        params: Promise.resolve({ id: String(col.id) }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe("New");
    });

    it("returns 404 for non-existent column", async () => {
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ name: "X" }),
      });
      const res = await updateColumn(req, {
        params: Promise.resolve({ id: "999" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/columns/[id]", () => {
    it("deletes a column", async () => {
      const col = createColumn(boardId, "X");
      const res = await deleteColumn(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(col.id) }),
      });
      expect(res.status).toBe(200);
      expect(getColumnsByBoard(boardId)).toHaveLength(0);
    });

    it("returns 404 for non-existent column", async () => {
      const res = await deleteColumn(new Request("http://localhost"), {
        params: Promise.resolve({ id: "999" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/columns/reorder", () => {
    it("reorders columns", async () => {
      const c1 = createColumn(boardId, "A"); // pos 0
      const c2 = createColumn(boardId, "B"); // pos 1
      const c3 = createColumn(boardId, "C"); // pos 2

      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ orderedIds: [c3.id, c1.id, c2.id] }),
      });
      const res = await reorderColumns(req);
      expect(res.status).toBe(200);

      const columns = getColumnsByBoard(boardId);
      expect(columns[0].id).toBe(c3.id);
      expect(columns[1].id).toBe(c1.id);
      expect(columns[2].id).toBe(c2.id);
    });

    it("rejects empty orderedIds", async () => {
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ orderedIds: [] }),
      });
      const res = await reorderColumns(req);
      expect(res.status).toBe(400);
    });

    it("rejects missing orderedIds", async () => {
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({}),
      });
      const res = await reorderColumns(req);
      expect(res.status).toBe(400);
    });
  });
});
