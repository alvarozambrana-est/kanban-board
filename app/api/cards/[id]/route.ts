import { NextResponse } from "next/server";
import { getCardById, updateCard, deleteCard, getUserById } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, priority, due_date, assignee_id } = body;

    if (priority && !["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    const hasAssignee = assignee_id !== undefined && assignee_id !== null;
    const assigneeId = hasAssignee && typeof assignee_id === "number"
      ? assignee_id
      : hasAssignee && typeof assignee_id === "string" && /^\d+$/.test(assignee_id)
        ? Number(assignee_id)
        : null;
    if (hasAssignee) {
      if (assigneeId === null || !Number.isSafeInteger(assigneeId) || !getUserById(assigneeId)) {
        return NextResponse.json({ error: "Invalid assignee_id" }, { status: 400 });
      }
    }

    const card = updateCard(Number(id), {
      title,
      description,
      priority,
      due_date,
      ...(assignee_id !== undefined ? { assignee_id: assigneeId } : {}),
    });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    return NextResponse.json(card);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteCard(Number(id));
    if (!deleted) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}
