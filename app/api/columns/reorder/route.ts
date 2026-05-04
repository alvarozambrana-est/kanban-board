import { NextResponse } from "next/server";
import { reorderColumns } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds array is required" }, { status: 400 });
    }

    reorderColumns(orderedIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reorder columns" }, { status: 500 });
  }
}
