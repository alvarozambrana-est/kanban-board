import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanColumn } from "../components/kanban-column";
import { BoardHeader } from "../components/board-header";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockFetch = vi.fn();

describe("S6 - Column UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("KanbanColumn", () => {
    const column = {
      id: 1,
      board_id: 1,
      name: "Todo",
      position: 0,
    };

    it("renders column name", () => {
      render(
        <KanbanColumn column={column} onRename={vi.fn()} onDelete={vi.fn()} onAddCard={vi.fn()} />
      );
      expect(screen.getByText("Todo")).toBeTruthy();
    });

    it("renders Add Card button", () => {
      render(
        <KanbanColumn column={column} onRename={vi.fn()} onDelete={vi.fn()} onAddCard={vi.fn()} />
      );
      expect(screen.getByText("Add Card")).toBeTruthy();
    });

    it("calls onAddCard when Add Card clicked", async () => {
      const onAddCard = vi.fn();
      render(
        <KanbanColumn
          column={column}
          onRename={vi.fn()}
          onDelete={vi.fn()}
          onAddCard={onAddCard}
        />
      );
      const user = userEvent.setup();
      await user.click(screen.getByText("Add Card"));
      expect(onAddCard).toHaveBeenCalledWith(1);
    });

    it("calls onDelete when delete clicked", async () => {
      const onDelete = vi.fn();
      render(
        <KanbanColumn
          column={column}
          onRename={vi.fn()}
          onDelete={onDelete}
          onAddCard={vi.fn()}
        />
      );
      const user = userEvent.setup();
      await user.click(screen.getByLabelText("Delete Todo"));
      expect(onDelete).toHaveBeenCalledWith(1);
    });

    it("enters edit mode on double click", async () => {
      render(
        <KanbanColumn column={column} onRename={vi.fn()} onDelete={vi.fn()} onAddCard={vi.fn()} />
      );
      const user = userEvent.setup();
      await user.dblClick(screen.getByText("Todo"));
      expect(screen.getByDisplayValue("Todo")).toBeTruthy();
    });

    it("calls onRename after editing name", async () => {
      const onRename = vi.fn();
      render(
        <KanbanColumn
          column={column}
          onRename={onRename}
          onDelete={vi.fn()}
          onAddCard={vi.fn()}
        />
      );
      const user = userEvent.setup();
      await user.dblClick(screen.getByText("Todo"));
      const input = screen.getByDisplayValue("Todo");
      await user.clear(input);
      await user.type(input, "New Name");
      await user.keyboard("{Enter}");
      expect(onRename).toHaveBeenCalledWith(1, "New Name");
    });

    it("renders children", () => {
      render(
        <KanbanColumn column={column} onRename={vi.fn()} onDelete={vi.fn()} onAddCard={vi.fn()}>
          <div>Card content</div>
        </KanbanColumn>
      );
      expect(screen.getByText("Card content")).toBeTruthy();
    });
  });

  describe("BoardHeader", () => {
    it("renders board name", () => {
      render(<BoardHeader name="My Board" onRename={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText("My Board")).toBeTruthy();
    });

    it("has link back to boards list", () => {
      render(<BoardHeader name="My Board" onRename={vi.fn()} onDelete={vi.fn()} />);
      const link = screen.getByLabelText("Back to boards");
      expect(link.closest("a")?.getAttribute("href")).toBe("/");
    });

    it("calls onDelete", async () => {
      const onDelete = vi.fn();
      render(<BoardHeader name="My Board" onRename={vi.fn()} onDelete={onDelete} />);
      const user = userEvent.setup();
      await user.click(screen.getByLabelText("Delete board"));
      expect(onDelete).toHaveBeenCalled();
    });

    it("enters edit mode on double click", async () => {
      render(<BoardHeader name="My Board" onRename={vi.fn()} onDelete={vi.fn()} />);
      const user = userEvent.setup();
      await user.dblClick(screen.getByText("My Board"));
      expect(screen.getByDisplayValue("My Board")).toBeTruthy();
    });

    it("calls onRename after edit", async () => {
      const onRename = vi.fn();
      render(<BoardHeader name="Old Name" onRename={onRename} onDelete={vi.fn()} />);
      const user = userEvent.setup();
      await user.dblClick(screen.getByText("Old Name"));
      const input = screen.getByDisplayValue("Old Name");
      await user.clear(input);
      await user.type(input, "New Name");
      await user.keyboard("{Enter}");
      expect(onRename).toHaveBeenCalledWith("New Name");
    });
  });

  describe("BoardPage", () => {
    beforeEach(() => {
      global.fetch = mockFetch;
    });

    it("shows loading state initially", async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise(() => {}) // never resolves
      );
      render(<div className="flex h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>);
      expect(screen.getByText("Loading...")).toBeTruthy();
    });
  });
});
