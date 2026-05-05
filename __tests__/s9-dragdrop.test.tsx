import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { DraggableCard } from "../components/draggable-card";
import { DroppableColumn } from "../components/droppable-column";
import type { Card, Column } from "../lib/db";

const mockCard: Card = {
  id: 1,
  column_id: 1,
  title: "Test Card",
  description: "Desc",
  position: 0,
  priority: "medium",
  due_date: "2026-06-15",
  created_at: "2026-05-04",
  updated_at: "2026-05-04",
};

const mockColumn: Column = {
  id: 1,
  board_id: 1,
  name: "Todo",
  position: 0,
};

function DndWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DndContext onDragEnd={vi.fn()} onDragStart={vi.fn()}>
      {children}
    </DndContext>
  );
}

// Mock next/link for KanbanColumn
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("S9 - Drag & Drop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DraggableCard", () => {
    it("renders card content inside a draggable wrapper", () => {
      render(
        <DndWrapper>
          <DraggableCard card={mockCard} onClick={vi.fn()} />
        </DndWrapper>
      );
      expect(screen.getByText("Test Card")).toBeTruthy();
    });

    it("renders priority badge", () => {
      render(
        <DndWrapper>
          <DraggableCard card={mockCard} onClick={vi.fn()} />
        </DndWrapper>
      );
      expect(screen.getByText("Med")).toBeTruthy();
    });

    it("renders due date", () => {
      render(
        <DndWrapper>
          <DraggableCard card={mockCard} onClick={vi.fn()} />
        </DndWrapper>
      );
      expect(screen.getByText("2026-06-15")).toBeTruthy();
    });
  });

  describe("DroppableColumn", () => {
    it("renders column with name", () => {
      render(
        <DndWrapper>
          <DroppableColumn
            column={mockColumn}
            onRename={vi.fn()}
            onDelete={vi.fn()}
            onAddCard={vi.fn()}
          />
        </DndWrapper>
      );
      expect(screen.getByText("Todo")).toBeTruthy();
    });

    it("renders Add Card button", () => {
      render(
        <DndWrapper>
          <DroppableColumn
            column={mockColumn}
            onRename={vi.fn()}
            onDelete={vi.fn()}
            onAddCard={vi.fn()}
          />
        </DndWrapper>
      );
      expect(screen.getByText("Add Card")).toBeTruthy();
    });

    it("renders children (cards)", () => {
      render(
        <DndWrapper>
          <DroppableColumn
            column={mockColumn}
            onRename={vi.fn()}
            onDelete={vi.fn()}
            onAddCard={vi.fn()}
          >
            <div>Child Card</div>
          </DroppableColumn>
        </DndWrapper>
      );
      expect(screen.getByText("Child Card")).toBeTruthy();
    });
  });
});
