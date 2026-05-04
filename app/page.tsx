"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardCard } from "@/components/board-card";
import { BoardDialog } from "@/components/board-dialog";
import type { Board } from "@/lib/db";

export default function HomePage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);

  const fetchBoards = useCallback(async () => {
    const res = await fetch("/api/boards");
    const data = await res.json();
    setBoards(data);
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreate = async (name: string) => {
    await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    fetchBoards();
  };

  const handleEdit = async (name: string) => {
    if (!editingBoard) return;
    await fetch(`/api/boards/${editingBoard.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setEditingBoard(null);
    fetchBoards();
  };

  const handleDelete = async (board: Board) => {
    await fetch(`/api/boards/${board.id}`, { method: "DELETE" });
    fetchBoards();
  };

  return (
    <main className="container mx-auto max-w-4xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Kanban Boards</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Board
        </Button>
      </div>

      {boards.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg">No boards yet. Create your first board!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onEdit={(b) => {
                setEditingBoard(b);
                setDialogOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <BoardDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingBoard(null);
        }}
        onSave={editingBoard ? handleEdit : handleCreate}
        initialName={editingBoard?.name}
      />
    </main>
  );
}
