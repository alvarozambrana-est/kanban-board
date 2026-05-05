import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import path from "path";
import fs from "fs";
import { setDbPath, getDb, closeDb, createBoard, createUser } from "../lib/db";
import { GET as getBoardUsers, POST as addBoardUser, DELETE as removeBoardUser } from "../app/api/boards/[id]/users/route";
import { GET as listUsers } from "../app/api/users/route";
import { GET as listTypes, POST as createType } from "../app/api/types/route";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const TEST_DB = path.join(__dirname, "test-managers.db");

describe("S18 - Per-project managers", () => {
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
    db.exec("DELETE FROM card_types");
    boardId = createBoard("Test Board").id;
  });

  describe("Board users management", () => {
    it("adds a user to board", async () => {
      const user = createUser("Alice");
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id }),
      });
      const res = await addBoardUser(req, {
        params: Promise.resolve({ id: String(boardId) }),
      });
      expect(res.status).toBe(201);

      const listRes = await getBoardUsers(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await listRes.json();
      expect(data).toHaveLength(1);
    });

    it("removes user from board", async () => {
      const user = createUser("Bob");
      createUser("Charlie"); // not on board
      await addBoardUser(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({ user_id: user.id }),
        }),
        { params: Promise.resolve({ id: String(boardId) }) }
      );

      const req = new Request(`http://localhost?user_id=${user.id}`, { method: "DELETE" });
      await removeBoardUser(req, {
        params: Promise.resolve({ id: String(boardId) }),
      });

      const users = await getBoardUsers(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const data = await users.json();
      expect(data).toHaveLength(0);
    });

    it("lists all users (global)", async () => {
      createUser("Alice");
      createUser("Bob");
      const res = await listUsers();
      const data = await res.json();
      expect(data).toHaveLength(2);
    });
  });

  describe("Card types management", () => {
    it("lists global types", async () => {
      const res = await listTypes();
      const data = await res.json();
      expect(data).toEqual([]);
    });

    it("creates a global type", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Bug" }),
      });
      const res = await createType(req);
      const data = await res.json();
      expect(data.name).toBe("Bug");
    });
  });

  describe("Board isolation", () => {
    it("board users are isolated per board", async () => {
      const board2 = createBoard("Board 2");
      const user1 = createUser("Alice");
      const user2 = createUser("Bob");

      await addBoardUser(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({ user_id: user1.id }),
        }),
        { params: Promise.resolve({ id: String(boardId) }) }
      );
      await addBoardUser(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({ user_id: user2.id }),
        }),
        { params: Promise.resolve({ id: String(board2.id) }) }
      );

      const b1Res = await getBoardUsers(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(boardId) }),
      });
      const b2Res = await getBoardUsers(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(board2.id) }),
      });

      const b1Users = await b1Res.json();
      const b2Users = await b2Res.json();
      expect(b1Users).toHaveLength(1);
      expect(b1Users[0].name).toBe("Alice");
      expect(b2Users).toHaveLength(1);
      expect(b2Users[0].name).toBe("Bob");
    });
  });
});
