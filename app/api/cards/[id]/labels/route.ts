import { NextResponse } from "next/server";
import { getCardLabels, addLabelToCard, removeLabelFromCard } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const labels = getCardLabels(Number(id));
    return NextResponse.json(labels);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch card labels" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { label_id } = body;

    if (!label_id) {
      return NextResponse.json({ error: "label_id is required" }, { status: 400 });
    }

    addLabelToCard(Number(id), Number(label_id));
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add label" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const labelId = searchParams.get("label_id");

    if (!labelId) {
      return NextResponse.json({ error: "label_id query parameter is required" }, { status: 400 });
    }

    removeLabelFromCard(Number(id), Number(labelId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove label" }, { status: 500 });
  }
}
