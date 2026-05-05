import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanCard } from "../components/kanban-card";
import { CardDialog } from "../components/card-dialog";

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

describe("S8 - Card UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("KanbanCard", () => {
    const baseCard = {
      id: 1,
      column_id: 1,
      title: "Test Task",
      description: "",
      position: 0,
      priority: "medium" as const,
      due_date: null,
      created_at: "2026-05-04",
      updated_at: "2026-05-04",
    };

    it("renders card title", () => {
      render(<KanbanCard card={baseCard} onClick={vi.fn()} />);
      expect(screen.getByText("Test Task")).toBeTruthy();
    });

    it("shows priority badge", () => {
      render(<KanbanCard card={{ ...baseCard, priority: "high" }} onClick={vi.fn()} />);
      expect(screen.getByText("High")).toBeTruthy();
    });

    it("shows medium priority as Med", () => {
      render(<KanbanCard card={baseCard} onClick={vi.fn()} />);
      expect(screen.getByText("Med")).toBeTruthy();
    });

    it("shows low priority", () => {
      render(<KanbanCard card={{ ...baseCard, priority: "low" }} onClick={vi.fn()} />);
      expect(screen.getByText("Low")).toBeTruthy();
    });

    it("shows description when present", () => {
      render(
        <KanbanCard
          card={{ ...baseCard, description: "Some description" }}
          onClick={vi.fn()}
        />
      );
      expect(screen.getByText("Some description")).toBeTruthy();
    });

    it("shows due date when present", () => {
      render(
        <KanbanCard
          card={{ ...baseCard, due_date: "2026-06-15" }}
          onClick={vi.fn()}
        />
      );
      expect(screen.getByText("2026-06-15")).toBeTruthy();
    });

    it("calls onClick when clicked", async () => {
      const onClick = vi.fn();
      render(<KanbanCard card={baseCard} onClick={onClick} />);
      const user = userEvent.setup();
      await user.click(screen.getByText("Test Task"));
      expect(onClick).toHaveBeenCalledWith(baseCard);
    });
  });

  describe("CardDialog", () => {
    it("renders create mode", () => {
      render(<CardDialog open={true} onClose={vi.fn()} onSave={vi.fn()} initial={null} />);
      expect(screen.getByText("Create Card")).toBeTruthy();
      expect(screen.getByPlaceholderText("Enter card title")).toBeTruthy();
    });

    it("renders edit mode with initial data", () => {
      const card = {
        id: 1,
        column_id: 1,
        title: "Existing Task",
        description: "Some desc",
        position: 0,
        priority: "high" as const,
        due_date: "2026-06-01",
        created_at: "2026-05-04",
        updated_at: "2026-05-04",
      };
      render(<CardDialog open={true} onClose={vi.fn()} onSave={vi.fn()} initial={card} />);
      expect(screen.getByText("Edit Card")).toBeTruthy();
      expect((screen.getByPlaceholderText("Enter card title") as HTMLInputElement).value).toBe(
        "Existing Task"
      );
    });

    it("calls onSave with form data", async () => {
      const onSave = vi.fn();
      render(<CardDialog open={true} onClose={vi.fn()} onSave={onSave} initial={null} />);
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText("Enter card title"), "New Card");
      await user.type(screen.getByPlaceholderText("Enter description (optional)"), "My desc");
      await user.click(screen.getByText("Create"));
      expect(onSave).toHaveBeenCalledWith({
        title: "New Card",
        description: "My desc",
        priority: "medium",
        due_date: "",
      });
    });

    it("shows error for empty title", async () => {
      render(<CardDialog open={true} onClose={vi.fn()} onSave={vi.fn()} initial={null} />);
      const user = userEvent.setup();
      await user.click(screen.getByText("Create"));
      expect(screen.getByText("Title is required")).toBeTruthy();
    });
  });
});
