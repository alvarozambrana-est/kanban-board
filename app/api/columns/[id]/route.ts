import { NextResponse } from "next/server";
import { getColumnById, updateColumn, deleteColumn } from "@/lib/db";

export async function PUT(
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

    const column = updateColumn(Number(id), name.trim());
    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }
    return NextResponse.json(column);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update column" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteColumn(Number(id));
    if (!deleted) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete column" }, { status: 500 });
  }
}
