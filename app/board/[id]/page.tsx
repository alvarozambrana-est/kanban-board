"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardHeader } from "@/components/board-header";
import { KanbanColumn } from "@/components/kanban-column";
import { Input } from "@/components/ui/input";
import type { Board, Column } from "@/lib/db";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = Number(params.id);

  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const fetchBoard = useCallback(async () => {
    const res = await fetch(`/api/boards/${boardId}`);
    if (!res.ok) return router.push("/");
    const data = await res.json();
    setBoard(data);
  }, [boardId, router]);

  const fetchColumns = useCallback(async () => {
    const res = await fetch(`/api/boards/${boardId}/columns`);
    const data = await res.json();
    setColumns(data);
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
    fetchColumns();
  }, [fetchBoard, fetchColumns]);

  const handleRenameBoard = async (name: string) => {
    await fetch(`/api/boards/${boardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    fetchBoard();
  };

  const handleDeleteBoard = async () => {
    await fetch(`/api/boards/${boardId}`, { method: "DELETE" });
    router.push("/");
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    await fetch(`/api/boards/${boardId}/columns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newColumnName.trim() }),
    });
    setNewColumnName("");
    setAddingColumn(false);
    fetchColumns();
  };

  const handleRenameColumn = async (id: number, name: string) => {
    await fetch(`/api/columns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    fetchColumns();
  };

  const handleDeleteColumn = async (id: number) => {
    await fetch(`/api/columns/${id}`, { method: "DELETE" });
    fetchColumns();
  };

  if (!board) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-background px-6 py-3">
        <BoardHeader
          name={board.name}
          onRename={handleRenameBoard}
          onDelete={handleDeleteBoard}
        />
      </header>

      <main className="flex flex-1 gap-4 overflow-x-auto p-6">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            onRename={handleRenameColumn}
            onDelete={handleDeleteColumn}
            onAddCard={() => {}}
          />
        ))}

        {addingColumn ? (
          <div className="flex w-72 shrink-0 flex-col gap-2 rounded-lg border bg-muted/30 p-3">
            <Input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
              onBlur={() => {
                if (!newColumnName.trim()) setAddingColumn(false);
              }}
              placeholder="Column name..."
              className="h-9"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddColumn}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingColumn(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-72 shrink-0 border-dashed"
            onClick={() => setAddingColumn(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Column
          </Button>
        )}
      </main>
    </div>
  );
}
