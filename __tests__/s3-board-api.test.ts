import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import fs from "fs";
import { setDbPath, getDb, closeDb, createBoard } from "../lib/db";
import { GET as listBoards, POST as createBoardHandler } from "../app/api/boards/route";
import {
  GET as getBoard,
  PUT as updateBoard,
  DELETE as deleteBoard,
} from "../app/api/boards/[id]/route";

const TEST_DB = path.join(__dirname, "test-board-api.db");

describe("S3 - Board API", () => {
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
  });

  describe("GET /api/boards", () => {
    it("returns empty array when no boards exist", async () => {
      const res = await listBoards();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("returns all boards ordered by created_at DESC", async () => {
      createBoard("A");
      createBoard("B");
      const res = await listBoards();
      const data = await res.json();
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe("B");
      expect(data[1].name).toBe("A");
    });
  });

  describe("POST /api/boards", () => {
    it("creates a board with valid name", async () => {
      const req = new Request("http://localhost/api/boards", {
        method: "POST",
        body: JSON.stringify({ name: "My Board" }),
      });
      const res = await createBoardHandler(req);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe("My Board");
      expect(data.id).toBeGreaterThan(0);
    });

    it("rejects empty name", async () => {
      const req = new Request("http://localhost/api/boards", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      });
      const res = await createBoardHandler(req);
      expect(res.status).toBe(400);
    });

    it("rejects missing name", async () => {
      const req = new Request("http://localhost/api/boards", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await createBoardHandler(req);
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/boards/[id]", () => {
    it("returns a board by ID", async () => {
      const board = createBoard("Test");
      const res = await getBoard(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(board.id) }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe("Test");
    });

    it("returns 404 for non-existent board", async () => {
      const res = await getBoard(new Request("http://localhost"), {
        params: Promise.resolve({ id: "999" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/boards/[id]", () => {
    it("updates a board name", async () => {
      const board = createBoard("Old");
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ name: "New" }),
      });
      const res = await updateBoard(req, {
        params: Promise.resolve({ id: String(board.id) }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe("New");
    });

    it("returns 404 when updating non-existent board", async () => {
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ name: "Nope" }),
      });
      const res = await updateBoard(req, {
        params: Promise.resolve({ id: "999" }),
      });
      expect(res.status).toBe(404);
    });

    it("rejects empty name on update", async () => {
      const board = createBoard("Old");
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ name: "" }),
      });
      const res = await updateBoard(req, {
        params: Promise.resolve({ id: String(board.id) }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/boards/[id]", () => {
    it("deletes a board", async () => {
      const board = createBoard("Delete Me");
      const res = await deleteBoard(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(board.id) }),
      });
      expect(res.status).toBe(200);
    });

    it("returns 404 when deleting non-existent board", async () => {
      const res = await deleteBoard(new Request("http://localhost"), {
        params: Promise.resolve({ id: "999" }),
      });
      expect(res.status).toBe(404);
    });
  });
});
