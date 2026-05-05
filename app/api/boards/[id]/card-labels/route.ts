import { NextResponse } from "next/server";
import { getCardLabelMapForBoard } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const labelMap = getCardLabelMapForBoard(Number(id));
    return NextResponse.json(labelMap);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch card labels" }, { status: 500 });
  }
}
