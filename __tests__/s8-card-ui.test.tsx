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
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = vi.fn(() => false);
    }
    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = vi.fn();
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = vi.fn();
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }
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
      type_id: null,
      author_id: null,
      assignee_id: null,
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

    it("shows assignee name when present", () => {
      render(
        <KanbanCard
          card={{ ...baseCard, assignee_id: 1 }}
          users={[{ id: 1, name: "Alice", email: null, avatar_url: null }]}
          onClick={vi.fn()}
        />
      );
      expect(screen.getByText("Alice")).toBeTruthy();
    });

    it("does not show assignee for unknown user", () => {
      render(
        <KanbanCard
          card={{ ...baseCard, assignee_id: 99 }}
          users={[{ id: 1, name: "Alice", email: null, avatar_url: null }]}
          onClick={vi.fn()}
        />
      );
      expect(screen.queryByText("Alice")).toBeNull();
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
        assignee_id: null,
      });
    });

    it("renders assignee selector", () => {
      render(
        <CardDialog
          open={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          initial={null}
          users={[{ id: 1, name: "Alice", email: null, avatar_url: null }]}
        />
      );
      expect(screen.getByText("Assignee")).toBeTruthy();
      expect(screen.getByText("Unassigned")).toBeTruthy();
    });

    it("preselects initial assignee", () => {
      const card = {
        id: 1,
        column_id: 1,
        title: "Existing Task",
        description: "Some desc",
        position: 0,
        priority: "high" as const,
        due_date: "2026-06-01",
        type_id: null,
        author_id: null,
        assignee_id: 2,
        created_at: "2026-05-04",
        updated_at: "2026-05-04",
      };
      render(
        <CardDialog
          open={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          initial={card}
          users={[{ id: 2, name: "Bob", email: null, avatar_url: null }]}
        />
      );
      expect(screen.getByText("Bob")).toBeTruthy();
    });

    it("submits selected assignee", async () => {
      const onSave = vi.fn();
      render(
        <CardDialog
          open={true}
          onClose={vi.fn()}
          onSave={onSave}
          initial={null}
          users={[{ id: 3, name: "Charlie", email: null, avatar_url: null }]}
        />
      );
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText("Enter card title"), "New Card");
      await user.click(screen.getByRole("combobox", { name: "Assignee" }));
      await user.click(screen.getByText("Charlie"));
      await user.click(screen.getByText("Create"));
      expect(onSave).toHaveBeenCalledWith({
        title: "New Card",
        description: "",
        priority: "medium",
        due_date: "",
        assignee_id: 3,
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
