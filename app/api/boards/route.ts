import { NextResponse } from "next/server";
import { getAllBoards, createBoard } from "@/lib/db";

export async function GET() {
  try {
    const boards = getAllBoards();
    return NextResponse.json(boards);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Board name is required" }, { status: 400 });
    }

    const board = createBoard(name.trim());
    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
  }
}
