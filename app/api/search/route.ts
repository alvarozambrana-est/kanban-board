import { NextResponse } from "next/server";
import { searchCards, type SearchFilters } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: SearchFilters = {};

    const q = searchParams.get("q");
    if (q) filters.q = q;

    const boardId = searchParams.get("board_id");
    if (boardId) filters.board_id = Number(boardId);

    const typeId = searchParams.get("type_id");
    if (typeId) filters.type_id = Number(typeId);

    const assigneeId = searchParams.get("assignee_id");
    if (assigneeId) filters.assignee_id = Number(assigneeId);

    const authorId = searchParams.get("author_id");
    if (authorId) filters.author_id = Number(authorId);

    const priority = searchParams.get("priority");
    if (priority) filters.priority = priority;

    const cards = searchCards(filters);
    return NextResponse.json(cards);
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
