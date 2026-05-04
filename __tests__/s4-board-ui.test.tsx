import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardCard } from "../components/board-card";
import { BoardDialog } from "../components/board-dialog";
import HomePage from "../app/page";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock fetch globally for HomePage tests
const mockFetch = vi.fn();

describe("S4 - Board UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BoardDialog", () => {
    it("renders create mode correctly", () => {
      render(
        <BoardDialog open={true} onClose={vi.fn()} onSave={vi.fn()} />
      );
      expect(screen.getByText("Create Board")).toBeTruthy();
      expect(screen.getByPlaceholderText("Enter board name")).toBeTruthy();
    });

    it("renders edit mode with initial name", () => {
      render(
        <BoardDialog
          open={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          initialName="My Board"
        />
      );
      expect(screen.getByText("Edit Board")).toBeTruthy();
      expect((screen.getByPlaceholderText("Enter board name") as HTMLInputElement).value).toBe(
        "My Board"
      );
    });

    it("calls onSave with trimmed name", async () => {
      const onSave = vi.fn();
      render(<BoardDialog open={true} onClose={vi.fn()} onSave={onSave} />);
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText("Enter board name"), "  Test Board  ");
      await user.click(screen.getByText("Create"));
      expect(onSave).toHaveBeenCalledWith("Test Board");
    });

    it("shows error for empty name", async () => {
      render(<BoardDialog open={true} onClose={vi.fn()} onSave={vi.fn()} />);
      const user = userEvent.setup();
      await user.click(screen.getByText("Create"));
      expect(screen.getByText("Board name is required")).toBeTruthy();
    });

    it("closes on cancel", async () => {
      const onClose = vi.fn();
      render(<BoardDialog open={true} onClose={onClose} onSave={vi.fn()} />);
      const user = userEvent.setup();
      await user.click(screen.getByText("Cancel"));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("BoardCard", () => {
    const board = {
      id: 1,
      name: "Test Board",
      created_at: "2026-05-04T00:00:00.000Z",
      updated_at: "2026-05-04T00:00:00.000Z",
    };

    it("renders board name and date", () => {
      render(<BoardCard board={board} onEdit={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText("Test Board")).toBeTruthy();
    });

    it("has link to board page", () => {
      render(<BoardCard board={board} onEdit={vi.fn()} onDelete={vi.fn()} />);
      const link = screen.getByRole("link");
      expect(link.getAttribute("href")).toBe("/board/1");
    });

    it("calls onEdit when edit button clicked", async () => {
      const onEdit = vi.fn();
      render(<BoardCard board={board} onEdit={onEdit} onDelete={vi.fn()} />);
      const user = userEvent.setup();
      await user.click(screen.getByLabelText("Edit Test Board"));
      expect(onEdit).toHaveBeenCalledWith(board);
    });

    it("calls onDelete when delete button clicked", async () => {
      const onDelete = vi.fn();
      render(<BoardCard board={board} onEdit={vi.fn()} onDelete={onDelete} />);
      const user = userEvent.setup();
      await user.click(screen.getByLabelText("Delete Test Board"));
      expect(onDelete).toHaveBeenCalledWith(board);
    });
  });

  describe("HomePage", () => {
    beforeEach(() => {
      global.fetch = mockFetch;
    });

    it("shows empty state when no boards", async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve([]) });
      render(<HomePage />);
      await waitFor(() => {
        expect(screen.getByText(/No boards yet/)).toBeTruthy();
      });
    });

    it("renders board list from API", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            { id: 1, name: "Board A", created_at: "2026-05-04", updated_at: "2026-05-04" },
            { id: 2, name: "Board B", created_at: "2026-05-04", updated_at: "2026-05-04" },
          ]),
      });
      render(<HomePage />);
      await waitFor(() => {
        expect(screen.getByText("Board A")).toBeTruthy();
        expect(screen.getByText("Board B")).toBeTruthy();
      });
    });

    it("has a create board button", () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve([]) });
      render(<HomePage />);
      expect(screen.getByText("New Board")).toBeTruthy();
    });
  });
});
