import { NextResponse } from "next/server";
import { getCardTypeById, updateCardType, deleteCardType } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Type name is required" }, { status: 400 });
    }

    const type = updateCardType(Number(id), name.trim(), color || "#6366f1");
    if (!type) return NextResponse.json({ error: "Type not found" }, { status: 404 });
    return NextResponse.json(type);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update type" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteCardType(Number(id));
    if (!deleted) return NextResponse.json({ error: "Type not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete type" }, { status: 500 });
  }
}
