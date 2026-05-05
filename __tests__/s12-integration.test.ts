import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import fs from "fs";
import { setDbPath, getDb, closeDb } from "../lib/db";
import { POST as createBoard } from "../app/api/boards/route";
import { GET as listBoards } from "../app/api/boards/route";
import { DELETE as deleteBoard } from "../app/api/boards/[id]/route";
import { POST as createColumn } from "../app/api/boards/[id]/columns/route";
import { GET as listColumns } from "../app/api/boards/[id]/columns/route";
import { POST as createCard } from "../app/api/boards/[id]/cards/route";
import { GET as listCards } from "../app/api/boards/[id]/cards/route";
import { PUT as updateCard } from "../app/api/cards/[id]/route";
import { DELETE as deleteCard } from "../app/api/cards/[id]/route";
import { PUT as moveCard } from "../app/api/cards/reorder/route";
import { PUT as reorderColumns } from "../app/api/columns/reorder/route";
import { POST as createLabel } from "../app/api/labels/route";
import { GET as listLabels } from "../app/api/labels/route";
import { POST as addLabelToCard } from "../app/api/cards/[id]/labels/route";
import { GET as getCardLabels } from "../app/api/cards/[id]/labels/route";

const TEST_DB = path.join(__dirname, "test-integration.db");

describe("S12 - Integration", () => {
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

  it("full workflow: board → columns → cards → labels → drag → verify", async () => {
    // 1. Create a board
    const boardReq = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Sprint 1" }),
    });
    const boardRes = await createBoard(boardReq);
    const board = await boardRes.json();
    expect(boardRes.status).toBe(201);
    expect(board.name).toBe("Sprint 1");

    // 2. Create columns
    const cols = ["Todo", "In Progress", "Done"];
    let columnIds: number[] = [];
    for (const colName of cols) {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: colName }),
      });
      const res = await createColumn(req, {
        params: Promise.resolve({ id: String(board.id) }),
      });
      const col = await res.json();
      columnIds.push(col.id);
    }

    // Verify columns
    const colsRes = await listColumns(new Request("http://localhost"), {
      params: Promise.resolve({ id: String(board.id) }),
    });
    const columns = await colsRes.json();
    expect(columns).toHaveLength(3);
    expect(columns[0].position).toBe(0);
    expect(columns[2].position).toBe(2);

    // 3. Add cards to Todo column
    const todoId = columnIds[0];
    const doneId = columnIds[2];

    const cardReq1 = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        column_id: todoId,
        title: "Setup CI/CD",
        description: "Configure GitHub Actions",
        priority: "high",
        due_date: "2026-05-10",
      }),
    });
    const card1Res = await createCard(cardReq1, {
      params: Promise.resolve({ id: String(board.id) }),
    });
    const card1 = await card1Res.json();

    const cardReq2 = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        column_id: todoId,
        title: "Write tests",
        priority: "medium",
      }),
    });
    const card2Res = await createCard(cardReq2, {
      params: Promise.resolve({ id: String(board.id) }),
    });
    const card2 = await card2Res.json();

    // 4. Verify cards
    const cardsRes = await listCards(new Request("http://localhost"), {
      params: Promise.resolve({ id: String(board.id) }),
    });
    const cards = await cardsRes.json();
    expect(cards).toHaveLength(2);
    expect(cards[0].title).toBe("Setup CI/CD");
    expect(cards[1].title).toBe("Write tests");

    // 5. Move a card to Done
    const moveReq = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ cardId: card1.id, toColumnId: doneId, toPosition: 0 }),
    });
    const movedRes = await moveCard(moveReq);
    const moved = await movedRes.json();
    expect(moved.column_id).toBe(doneId);

    // 6. Verify card moved
    const cardsAfterMove = await listCards(new Request("http://localhost"), {
      params: Promise.resolve({ id: String(board.id) }),
    });
    const movedCards = await cardsAfterMove.json();
    const todoCards = movedCards.filter((c: { column_id: number }) => c.column_id === todoId);
    const doneCards = movedCards.filter((c: { column_id: number }) => c.column_id === doneId);
    expect(todoCards).toHaveLength(1);
    expect(doneCards).toHaveLength(1);

    // 7. Create and assign labels
    const labelReq = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "urgent", color: "#ff0000" }),
    });
    const labelRes = await createLabel(labelReq);
    const label = await labelRes.json();

    const labelReq2 = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "backend", color: "#0000ff" }),
    });
    const labelRes2 = await createLabel(labelReq2);
    const label2 = await labelRes2.json();

    // Assign labels to card2
    await addLabelToCard(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ label_id: label.id }),
      }),
      { params: Promise.resolve({ id: String(card2.id) }) }
    );
    await addLabelToCard(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ label_id: label2.id }),
      }),
      { params: Promise.resolve({ id: String(card2.id) }) }
    );

    // Verify labels
    const cardLabelsRes = await getCardLabels(new Request("http://localhost"), {
      params: Promise.resolve({ id: String(card2.id) }),
    });
    const cardLabels = await cardLabelsRes.json();
    expect(cardLabels).toHaveLength(2);

    // 8. Update a card
    const updateReq = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ title: "Write integration tests", priority: "high" }),
    });
    const updatedRes = await updateCard(updateReq, {
      params: Promise.resolve({ id: String(card2.id) }),
    });
    const updated = await updatedRes.json();
    expect(updated.title).toBe("Write integration tests");
    expect(updated.priority).toBe("high");

    // 9. Reorder columns
    const reorderReq = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ orderedIds: [columnIds[2], columnIds[0], columnIds[1]] }),
    });
    await reorderColumns(reorderReq);

    const reorderedCols = await listColumns(new Request("http://localhost"), {
      params: Promise.resolve({ id: String(board.id) }),
    });
    const reordered = await reorderedCols.json();
    expect(reordered[0].id).toBe(columnIds[2]); // Done first
    expect(reordered[1].id).toBe(columnIds[0]); // Todo second

    // 10. Delete a card
    const delRes = await deleteCard(new Request("http://localhost"), {
      params: Promise.resolve({ id: String(card1.id) }),
    });
    expect(delRes.status).toBe(200);

    const finalCards = await listCards(new Request("http://localhost"), {
      params: Promise.resolve({ id: String(board.id) }),
    });
    const finalData = await finalCards.json();
    expect(finalData).toHaveLength(1);

    // 11. Verify board list
    const boardsRes = await listBoards();
    const boards = await boardsRes.json();
    expect(boards).toHaveLength(1);

    // 12. Delete board cascades
    await deleteBoard(new Request("http://localhost"), {
      params: Promise.resolve({ id: String(board.id) }),
    });
    const emptyBoardsRes = await listBoards();
    const emptyBoards = await emptyBoardsRes.json();
    expect(emptyBoards).toHaveLength(0);
  });

  it("handles concurrent operations on different boards", async () => {
    // Create two boards
    const res1 = await createBoard(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Board A" }),
      })
    );
    const boardA = await res1.json();

    const res2 = await createBoard(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Board B" }),
      })
    );
    const boardB = await res2.json();

    // Add columns to each independently
    await createColumn(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Col A1" }),
      }),
      { params: Promise.resolve({ id: String(boardA.id) }) }
    );
    await createColumn(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Col B1" }),
      }),
      { params: Promise.resolve({ id: String(boardB.id) }) }
    );

    // Verify isolation
    const colsA = await listColumns(new Request("http://localhost"), {
      params: Promise.resolve({ id: String(boardA.id) }),
    });
    const colsB = await listColumns(new Request("http://localhost"), {
      params: Promise.resolve({ id: String(boardB.id) }),
    });
    expect((await colsA.json())).toHaveLength(1);
    expect((await colsB.json())).toHaveLength(1);

    // Delete Board A should not affect Board B
    await deleteBoard(new Request("http://localhost"), {
      params: Promise.resolve({ id: String(boardA.id) }),
    });
    const remaining = await listBoards();
    const remainingBoards = await remaining.json();
    expect(remainingBoards).toHaveLength(1);
    expect(remainingBoards[0].name).toBe("Board B");
  });
});
