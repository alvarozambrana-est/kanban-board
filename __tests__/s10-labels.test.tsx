import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import path from "path";
import fs from "fs";
import { setDbPath, getDb, closeDb, createLabel, createBoard, createColumn, createCard, addLabelToCard, getCardLabels } from "../lib/db";
import { GET as listLabels, POST as createLabelHandler } from "../app/api/labels/route";
import { PUT as updateLabel, DELETE as deleteLabel } from "../app/api/labels/[id]/route";
import { GET as getCardLabelsHandler, POST as addLabelToCardHandler, DELETE as removeLabelFromCard } from "../app/api/cards/[id]/labels/route";
import { LabelBadge } from "../components/label-badge";
import { KanbanCard } from "../components/kanban-card";

const TEST_DB = path.join(__dirname, "test-labels.db");

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("S10 - Labels API + UI", () => {
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

  describe("Label API", () => {
    it("GET returns empty array", async () => {
      const res = await listLabels();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("POST creates a label", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Bug", color: "#ff0000" }),
      });
      const res = await createLabelHandler(req);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe("Bug");
      expect(data.color).toBe("#ff0000");
    });

    it("POST uses default color", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Feature" }),
      });
      const res = await createLabelHandler(req);
      const data = await res.json();
      expect(data.color).toBe("#6366f1");
    });

    it("POST rejects empty name", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      });
      const res = await createLabelHandler(req);
      expect(res.status).toBe(400);
    });

    it("PUT updates a label", async () => {
      const label = createLabel("Old", "#111111");
      const req = new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ name: "New", color: "#222222" }),
      });
      const res = await updateLabel(req, {
        params: Promise.resolve({ id: String(label.id) }),
      });
      const data = await res.json();
      expect(data.name).toBe("New");
      expect(data.color).toBe("#222222");
    });

    it("DELETE removes a label", async () => {
      const label = createLabel("X", "#000");
      const res = await deleteLabel(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(label.id) }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe("Card Labels API", () => {
    let cardId: number;

    beforeEach(() => {
      const board = createBoard("Test Board");
      const col = createColumn(board.id, "Todo");
      cardId = createCard(col.id, "Task").id;
    });

    it("GET returns card labels", async () => {
      const label = createLabel("Bug", "#ff0000");
      addLabelToCard(cardId, label.id);
      const res = await getCardLabelsHandler(new Request("http://localhost"), {
        params: Promise.resolve({ id: String(cardId) }),
      });
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe("Bug");
    });

    it("POST adds a label to card", async () => {
      const label = createLabel("Bug", "#ff0000");
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ label_id: label.id }),
      });
      const res = await addLabelToCardHandler(req, {
        params: Promise.resolve({ id: String(cardId) }),
      });
      expect(res.status).toBe(201);
      expect(getCardLabels(cardId)).toHaveLength(1);
    });

    it("DELETE removes a label from card", async () => {
      const label = createLabel("Bug", "#ff0000");
      addLabelToCard(cardId, label.id);
      const req = new Request(`http://localhost?label_id=${label.id}`, { method: "DELETE" });
      const res = await removeLabelFromCard(req, {
        params: Promise.resolve({ id: String(cardId) }),
      });
      expect(res.status).toBe(200);
      expect(getCardLabels(cardId)).toHaveLength(0);
    });
  });

  describe("LabelBadge", () => {
    it("renders label name and color", () => {
      render(<LabelBadge name="Bug" color="#ff0000" />);
      expect(screen.getByText("Bug")).toBeTruthy();
    });

    it("shows remove button when onRemove provided", () => {
      render(<LabelBadge name="Bug" color="#ff0000" onRemove={vi.fn()} />);
      expect(screen.getByLabelText("Remove Bug label")).toBeTruthy();
    });

    it("calls onRemove when remove clicked", async () => {
      const onRemove = vi.fn();
      render(<LabelBadge name="Bug" color="#ff0000" onRemove={onRemove} />);
      const user = userEvent.setup();
      await user.click(screen.getByLabelText("Remove Bug label"));
      expect(onRemove).toHaveBeenCalled();
    });
  });

  describe("KanbanCard with labels", () => {
    const card = {
      id: 1,
      column_id: 1,
      title: "Task",
      description: "",
      position: 0,
      priority: "medium" as const,
      due_date: null,
      created_at: "2026-05-04",
      updated_at: "2026-05-04",
    };

    it("shows label badges when labels provided", () => {
      render(
        <KanbanCard
          card={card}
          labels={[
            { id: 1, name: "Bug", color: "#ff0000" },
            { id: 2, name: "Feature", color: "#00ff00" },
          ]}
          onClick={vi.fn()}
        />
      );
      expect(screen.getByText("Bug")).toBeTruthy();
      expect(screen.getByText("Feature")).toBeTruthy();
    });

    it("does not show label section when no labels", () => {
      render(<KanbanCard card={card} onClick={vi.fn()} />);
      expect(screen.queryByText("Bug")).toBeNull();
    });
  });
});
