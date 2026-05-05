import { NextResponse } from "next/server";
import { getAllLabels, createLabel } from "@/lib/db";

export async function GET() {
  try {
    const labels = getAllLabels();
    return NextResponse.json(labels);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Label name is required" }, { status: 400 });
    }

    const label = createLabel(name.trim(), color || "#6366f1");
    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create label" }, { status: 500 });
  }
}
