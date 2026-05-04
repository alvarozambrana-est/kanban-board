import { NextResponse } from "next/server";
import { getColumnsByBoard, createColumn } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const columns = getColumnsByBoard(Number(id));
    return NextResponse.json(columns);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch columns" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Column name is required" }, { status: 400 });
    }

    const column = createColumn(Number(id), name.trim());
    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create column" }, { status: 500 });
  }
}
