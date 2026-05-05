import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import fs from "fs";
import { setDbPath, getDb, closeDb, createBoard, createUser, getAllUsers, getBoardUsers, addUserToBoard, removeUserFromBoard, createColumn, createCard } from "../lib/db";
import { GET as listUsers, POST as createUserHandler } from "../app/api/users/route";
import { PUT as updateUser, DELETE as deleteUser } from "../app/api/users/[id]/route";
import { GET as listBoardUsers, POST as addBoardUser, DELETE as removeBoardUser } from "../app/api/boards/[id]/users/route";

const TEST_DB = path.join(__dirname, "test-users.db");

describe("S14 - Users CRUD + board membership", () => {
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
    db.exec("DELETE FROM board_users");
    db.exec("DELETE FROM card_labels");
    db.exec("DELETE FROM labels");
    db.exec("DELETE FROM cards");
    db.exec("DELETE FROM columns");
    db.exec("DELETE FROM boards");
    db.exec("DELETE FROM users");
    boardId = createBoard("Test Board").id;
  });

  describe("User CRUD API", () => {
    it("GET returns empty array", async () => {
      const res = await listUsers();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("POST creates a user", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Alice", email: "alice@test.com", avatar_url: "http://img" }),
      });
      const res = await createUserHandler(req);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe("Alice");
      expect(data.email).toBe("alice@test.com");
      expect(data.avatar_url).toBe("http://img");
    });

    it("POST creates user without email", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Bob" }),
      });
      const res = await createUserHandler(req);
      const data = await res.json();
      expect(data.email).toBeNull();
    });

    it("POST rejects empty name", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      });
      const res = await createUserHandler(req);
      expect(res.status).toBe(400);
    });

    it("PUT updates a user", async () => {
      const user = createUser("Old", "old@test.com");
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ name: "New", email: "new@test.com" }),
      });
      const res = await updateUser(req, {
        params: Promise.resolve({ id: String(user.id) }),
      });
      const data = await res.json();
      expect(data.name).toBe("New");
      expect(data.email).toBe("new@test.com");
    });

    it("DELETE removes a user", async () => {
      const user = createUser("Delete Me");
      const res = await deleteUser(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(user.id) }),
      });
      expect(res.status).toBe(200);
      expect(getAllUsers()).toHaveLength(0);
    });
  });

  describe("Board users API", () => {
    let user1Id: number;
    let user2Id: number;

    beforeEach(() => {
      user1Id = createUser("Alice").id;
      user2Id = createUser("Bob").id;
    });

    it("GET returns empty for board with no users", async () => {
      const res = await listBoardUsers(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(data).toEqual([]);
    });

    it("POST adds user to board", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ user_id: user1Id }),
      });
      await addBoardUser(req, { params: Promise.resolve({ id: String(boardId) }) });
      expect(getBoardUsers(boardId)).toHaveLength(1);
    });

    it("GET returns board users", async () => {
      addUserToBoard(boardId, user1Id);
      addUserToBoard(boardId, user2Id);
      const res = await listBoardUsers(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await res.json();
      expect(data).toHaveLength(2);
    });

    it("DELETE removes user from board", async () => {
      addUserToBoard(boardId, user1Id);
      const req = new Request(`http://localhost?user_id=${user1Id}`, { method: "DELETE" });
      await removeBoardUser(req, { params: Promise.resolve({ id: String(boardId) }) });
      expect(getBoardUsers(boardId)).toHaveLength(0);
    });

    it("does not duplicate board user entries", () => {
      addUserToBoard(boardId, user1Id);
      addUserToBoard(boardId, user1Id);
      expect(getBoardUsers(boardId)).toHaveLength(1);
    });
  });

  describe("Card author/assignee", () => {
    it("creates card with author and assignee", () => {
      const user1 = createUser("Author");
      const user2 = createUser("Assignee");
      const col = createColumn(boardId, "Todo");
      const card = createCard(col.id, "Task", "", "medium", null, undefined, user1.id, user2.id);
      expect(card.author_id).toBe(user1.id);
      expect(card.assignee_id).toBe(user2.id);
    });

    it("creates card without author/assignee", () => {
      const col = createColumn(boardId, "Todo");
      const card = createCard(col.id, "Task");
      expect(card.author_id).toBeNull();
      expect(card.assignee_id).toBeNull();
    });
  });
});
