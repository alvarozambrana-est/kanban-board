import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import fs from "fs";
import { setDbPath, getDb, closeDb, createCardType, getAllCardTypes, createBoard, createColumn, createCard } from "../lib/db";
import { GET as listTypes, POST as createType } from "../app/api/types/route";
import { PUT as updateType, DELETE as deleteType } from "../app/api/types/[id]/route";

const TEST_DB = path.join(__dirname, "test-types.db");

describe("S15 - Card types", () => {
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
    db.exec("DELETE FROM card_types");
  });

  describe("Type API", () => {
    it("GET returns empty array", async () => {
      const res = await listTypes();
      const data = await res.json();
      expect(data).toEqual([]);
    });

    it("POST creates a type", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Bug", color: "#ff0000" }),
      });
      const res = await createType(req);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe("Bug");
    });

    it("PUT updates a type", async () => {
      const type = createCardType("Old", "#111");
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ name: "New", color: "#222" }),
      });
      const res = await updateType(req, {
        params: Promise.resolve({ id: String(type.id) }),
      });
      const data = await res.json();
      expect(data.name).toBe("New");
    });

    it("DELETE removes a type", async () => {
      const type = createCardType("X");
      await deleteType(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(type.id) }),
      });
      expect(getAllCardTypes()).toHaveLength(0);
    });
  });

  describe("Card with type", () => {
    it("creates card with type_id", () => {
      const type = createCardType("Bug");
      const board = createBoard("B");
      const col = createColumn(board.id, "Todo");
      const card = createCard(col.id, "Task", "", "medium", null, type.id);
      expect(card.type_id).toBe(type.id);
    });

    it("creates card without type", () => {
      const board = createBoard("B");
      const col = createColumn(board.id, "Todo");
      const card = createCard(col.id, "Task");
      expect(card.type_id).toBeNull();
    });
  });
});
