import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function escapeCSV(field: unknown): string {
  const s = String(field ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const delimiter = format === "tsv" ? "\t" : ",";

    const db = getDb();
    const cards = db
      .prepare(
        `SELECT
           c.id,
           c.title,
           c.description,
           c.priority,
           c.due_date,
           c.created_at,
           c.updated_at,
           col.name AS column_name,
           b.name AS board_name,
           ct.name AS type_name,
           ua.name AS assignee_name,
           uau.name AS author_name,
           GROUP_CONCAT(l.name, '; ') AS labels
         FROM cards c
         JOIN columns col ON c.column_id = col.id
         JOIN boards b ON col.board_id = b.id
         LEFT JOIN card_types ct ON c.type_id = ct.id
         LEFT JOIN users ua ON c.assignee_id = ua.id
         LEFT JOIN users uau ON c.author_id = uau.id
         LEFT JOIN card_labels cl ON c.id = cl.card_id
         LEFT JOIN labels l ON cl.label_id = l.id
         WHERE b.id = ?
         GROUP BY c.id
         ORDER BY col.position, c.position`
      )
      .all(Number(id)) as Record<string, string | null>[];

    if (cards.length === 0) {
      return new NextResponse("No cards to export", { status: 200 });
    }

    const headers = [
      "ID", "Title", "Description", "Priority", "Due Date",
      "Column", "Board", "Type", "Assignee", "Author", "Labels",
      "Created At", "Updated At",
    ];

    const rows = cards.map((c) =>
      [
        c.id,
        c.title,
        c.description,
        c.priority,
        c.due_date,
        c.column_name,
        c.board_name,
        c.type_name,
        c.assignee_name,
        c.author_name,
        c.labels,
        c.created_at,
        c.updated_at,
      ]
        .map((v) => escapeCSV(v))
        .join(delimiter)
    );

    const escapedHeader = headers.map((h) => escapeCSV(h)).join(delimiter);
    const content = [escapedHeader, ...rows].join("\n");

    const contentType = format === "tsv" ? "text/tab-separated-values" : "text/csv";
    const ext = format === "tsv" ? "tsv" : "csv";

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="board-${id}-export.${ext}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
