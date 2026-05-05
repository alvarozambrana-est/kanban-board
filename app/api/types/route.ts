import { NextResponse } from "next/server";
import { getAllCardTypes, createCardType } from "@/lib/db";

export async function GET() {
  try {
    const types = getAllCardTypes();
    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch card types" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Type name is required" }, { status: 400 });
    }

    const type = createCardType(name.trim(), color || "#6366f1");
    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create card type" }, { status: 500 });
  }
}
