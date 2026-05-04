import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import fs from "fs";
import {
  setDbPath,
  getDb,
  closeDb,
  createBoard,
  getAllBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  createColumn,
  getColumnsByBoard,
  updateColumn,
  deleteColumn,
  createCard,
  getCardsByColumn,
  getCardsByBoard,
  getCardById,
  updateCard,
  deleteCard,
  moveCard,
  createLabel,
  getAllLabels,
  getCardLabels,
  addLabelToCard,
  removeLabelFromCard,
  deleteLabel,
} from "../lib/db";

const TEST_DB = path.join(__dirname, "test-kanban.db");

describe("S2 - Database layer", () => {
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

  describe("Schema", () => {
    it("creates the kanban.db file", () => {
      expect(fs.existsSync(TEST_DB)).toBe(true);
    });

    it("has boards table", () => {
      const row = getDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='boards'").get();
      expect(row).toBeTruthy();
    });

    it("has columns table", () => {
      const row = getDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='columns'").get();
      expect(row).toBeTruthy();
    });

    it("has cards table", () => {
      const row = getDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cards'").get();
      expect(row).toBeTruthy();
    });

    it("has labels table", () => {
      const row = getDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='labels'").get();
      expect(row).toBeTruthy();
    });

    it("has card_labels table", () => {
      const row = getDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='card_labels'").get();
      expect(row).toBeTruthy();
    });

    it("enforces foreign keys", () => {
      const row = getDb().prepare("PRAGMA foreign_keys").get() as { foreign_keys: number };
      expect(row.foreign_keys).toBe(1);
    });
  });

  describe("Board CRUD", () => {
    it("creates a board", () => {
      const board = createBoard("Test Board");
      expect(board.id).toBeGreaterThan(0);
      expect(board.name).toBe("Test Board");
      expect(board.created_at).toBeTruthy();
    });

    it("gets all boards", () => {
      createBoard("A");
      createBoard("B");
      const boards = getAllBoards();
      expect(boards).toHaveLength(2);
    });

    it("gets board by ID", () => {
      const created = createBoard("My Board");
      const board = getBoardById(created.id);
      expect(board?.name).toBe("My Board");
    });

    it("returns undefined for non-existent board", () => {
      expect(getBoardById(999)).toBeUndefined();
    });

    it("updates a board name", () => {
      const board = createBoard("Old");
      const updated = updateBoard(board.id, "New");
      expect(updated?.name).toBe("New");
    });

    it("deletes a board", () => {
      const board = createBoard("Delete Me");
      const result = deleteBoard(board.id);
      expect(result).toBe(true);
      expect(getBoardById(board.id)).toBeUndefined();
    });

    it("cascade deletes columns when board deleted", () => {
      const board = createBoard("Cascade Board");
      createColumn(board.id, "Col 1");
      deleteBoard(board.id);
      expect(getColumnsByBoard(board.id)).toHaveLength(0);
    });
  });

  describe("Column CRUD", () => {
    it("creates a column with auto position", () => {
      const board = createBoard("B");
      const col = createColumn(board.id, "Todo");
      expect(col.name).toBe("Todo");
      expect(col.position).toBe(0);
    });

    it("auto-increments position", () => {
      const board = createBoard("B");
      const c1 = createColumn(board.id, "First");
      const c2 = createColumn(board.id, "Second");
      expect(c2.position).toBe(1);
    });

    it("gets columns by board", () => {
      const board = createBoard("B");
      createColumn(board.id, "A");
      createColumn(board.id, "B");
      expect(getColumnsByBoard(board.id)).toHaveLength(2);
    });

    it("updates column name", () => {
      const board = createBoard("B");
      const col = createColumn(board.id, "Old");
      const updated = updateColumn(col.id, "New");
      expect(updated?.name).toBe("New");
    });

    it("deletes a column", () => {
      const board = createBoard("B");
      const col = createColumn(board.id, "X");
      deleteColumn(col.id);
      expect(getColumnsByBoard(board.id)).toHaveLength(0);
    });
  });

  describe("Card CRUD", () => {
    let boardId: number;
    let columnId: number;

    beforeEach(() => {
      boardId = createBoard("B").id;
      columnId = createColumn(boardId, "Todo").id;
    });

    it("creates a card", () => {
      const card = createCard(columnId, "Task 1", "Desc", "high", "2026-06-01");
      expect(card.title).toBe("Task 1");
      expect(card.description).toBe("Desc");
      expect(card.priority).toBe("high");
      expect(card.due_date).toBe("2026-06-01");
      expect(card.position).toBe(0);
    });

    it("gets cards by column", () => {
      createCard(columnId, "A");
      createCard(columnId, "B");
      expect(getCardsByColumn(columnId)).toHaveLength(2);
    });

    it("gets cards by board", () => {
      createCard(columnId, "A");
      const col2 = createColumn(boardId, "Done");
      createCard(col2.id, "B");
      expect(getCardsByBoard(boardId)).toHaveLength(2);
    });

    it("updates a card", () => {
      const card = createCard(columnId, "Old", "", "low");
      const updated = updateCard(card.id, { title: "New", priority: "high" });
      expect(updated?.title).toBe("New");
      expect(updated?.priority).toBe("high");
    });

    it("deletes a card", () => {
      const card = createCard(columnId, "X");
      deleteCard(card.id);
      expect(getCardById(card.id)).toBeUndefined();
    });

    it("moves card to a different column", () => {
      const col2 = createColumn(boardId, "Done");
      const card = createCard(columnId, "Task");
      const moved = moveCard(card.id, col2.id, 0);
      expect(moved?.column_id).toBe(col2.id);
      expect(moved?.position).toBe(0);
    });

    it("repositions cards when moving within same column", () => {
      createCard(columnId, "A"); // pos 0
      createCard(columnId, "B"); // pos 1
      const c3 = createCard(columnId, "C"); // pos 2
      moveCard(c3.id, columnId, 0); // move C to top
      const cards = getCardsByColumn(columnId);
      expect(cards[0].title).toBe("C");
      expect(cards[1].title).toBe("A");
      expect(cards[2].title).toBe("B");
    });
  });

  describe("Label CRUD", () => {
    it("creates a label", () => {
      const label = createLabel("Bug", "#ff0000");
      expect(label.name).toBe("Bug");
      expect(label.color).toBe("#ff0000");
    });

    it("gets all labels", () => {
      createLabel("A", "#111111");
      createLabel("B", "#222222");
      expect(getAllLabels()).toHaveLength(2);
    });

    it("adds and removes labels from cards", () => {
      const board = createBoard("B");
      const col = createColumn(board.id, "Todo");
      const card = createCard(col.id, "Task");
      const label = createLabel("Urgent", "#ff0000");

      addLabelToCard(card.id, label.id);
      expect(getCardLabels(card.id)).toHaveLength(1);
      expect(getCardLabels(card.id)[0].name).toBe("Urgent");

      removeLabelFromCard(card.id, label.id);
      expect(getCardLabels(card.id)).toHaveLength(0);
    });

    it("does not duplicate label assignment", () => {
      const board = createBoard("B");
      const col = createColumn(board.id, "Todo");
      const card = createCard(col.id, "Task");
      const label = createLabel("A", "#000");

      addLabelToCard(card.id, label.id);
      addLabelToCard(card.id, label.id); // second time ignored
      expect(getCardLabels(card.id)).toHaveLength(1);
    });

    it("deletes a label", () => {
      const label = createLabel("X", "#000");
      deleteLabel(label.id);
      expect(getAllLabels()).toHaveLength(0);
    });
  });
});
