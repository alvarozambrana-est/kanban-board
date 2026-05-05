import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import path from "path";
import fs from "fs";
import { setDbPath, getDb, closeDb, createBoard, createLabel, getLabelsByBoard, getAllLabels, createColumn, createCard, addLabelToCard, getCardLabels } from "../lib/db";
import { GET as listBoardLabels, POST as createBoardLabel } from "../app/api/boards/[id]/labels/route";

const TEST_DB = path.join(__dirname, "test-labels-v2.db");

describe("S13 - Labels per-project + card dialog assignment", () => {
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

  describe("Label per-project isolation", () => {
    it("creates label scoped to board", () => {
      const label = createLabel("Bug", "#ff0000", boardId);
      expect(label.board_id).toBe(boardId);
    });

    it("getLabelsByBoard returns only board labels plus global", () => {
      const board2 = createBoard("Other Board");
      createLabel("A", "#111", boardId);
      createLabel("B", "#222", board2.id);
      createLabel("Global", "#333"); // no board_id

      const labels = getLabelsByBoard(boardId);
      expect(labels).toHaveLength(2); // "A" (board-scoped) + "Global"
      expect(labels.map((l) => l.name).sort()).toEqual(["A", "Global"]);
    });

    it("GET /api/boards/[id]/labels returns board-scoped labels", async () => {
      createLabel("Board Label", "#ff0000", boardId);
      const res = await listBoardLabels(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe("Board Label");
    });

    it("POST /api/boards/[id]/labels creates board-scoped label", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Feature", color: "#00ff00" }),
      });
      const res = await createBoardLabel(req, {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.board_id).toBe(boardId);
    });
  });

  describe("Label DB layer consistency", () => {
    it("label is created with board_id", () => {
      const label = createLabel("Test", "#abc", boardId);
      expect(label.board_id).toBe(boardId);
    });

    it("getAllLabels returns all across boards", () => {
      const b2 = createBoard("B2");
      createLabel("L1", "#111", boardId);
      createLabel("L2", "#222", b2.id);
      expect(getAllLabels()).toHaveLength(2);
    });

    it("labels cascade delete with board", () => {
      createLabel("L1", "#111", boardId);
      const db = getDb();
      db.prepare("DELETE FROM boards WHERE id = ?").run(boardId);
      const remaining = getAllLabels();
      expect(remaining).toHaveLength(0);
    });
  });
});
