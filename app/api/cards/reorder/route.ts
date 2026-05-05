import { NextResponse } from "next/server";
import { moveCard } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { cardId, toColumnId, toPosition } = body;

    if (cardId === undefined || toColumnId === undefined || toPosition === undefined) {
      return NextResponse.json(
        { error: "cardId, toColumnId, and toPosition are required" },
        { status: 400 }
      );
    }

    const card = moveCard(Number(cardId), Number(toColumnId), Number(toPosition));
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    return NextResponse.json(card);
  } catch (error) {
    return NextResponse.json({ error: "Failed to move card" }, { status: 500 });
  }
}
