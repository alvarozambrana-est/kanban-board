import { NextResponse } from "next/server";
import { getCardsByBoard, createCard, getUserById } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cards = getCardsByBoard(Number(id));
    return NextResponse.json(cards);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { column_id, title, description, priority, due_date, assignee_id } = body;

    if (!column_id) {
      return NextResponse.json({ error: "column_id is required" }, { status: 400 });
    }
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Card title is required" }, { status: 400 });
    }

    const validPriorities = ["low", "medium", "high"];
    const cardPriority = validPriorities.includes(priority) ? priority : "medium";

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

    const card = createCard(
      Number(column_id),
      title.trim(),
      description || "",
      cardPriority as "low" | "medium" | "high",
      due_date || null,
      undefined,
      undefined,
      assigneeId ?? undefined
    );
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}
