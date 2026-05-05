import { NextResponse } from "next/server";
import { getLabelById, updateLabel, deleteLabel } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Label name is required" }, { status: 400 });
    }

    const label = updateLabel(Number(id), name.trim(), color || "#6366f1");
    if (!label) {
      return NextResponse.json({ error: "Label not found" }, { status: 404 });
    }
    return NextResponse.json(label);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update label" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteLabel(Number(id));
    if (!deleted) {
      return NextResponse.json({ error: "Label not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete label" }, { status: 500 });
  }
}
