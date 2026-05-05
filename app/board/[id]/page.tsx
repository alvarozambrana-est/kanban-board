"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Tag } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { BoardHeader } from "@/components/board-header";
import { SortableColumnItem } from "@/components/sortable-column-item";
import { DraggableCard } from "@/components/draggable-card";
import { KanbanCard } from "@/components/kanban-card";
import { CardDialog } from "@/components/card-dialog";
import { LabelManager } from "@/components/label-manager";
import { Input } from "@/components/ui/input";
import type { Board, Column, Card, Label } from "@/lib/db";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = Number(params.id);

  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [cardLabelMap, setCardLabelMap] = useState<Record<number, Label[]>>({});
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

  const fetchCards = useCallback(async () => {
    const res = await fetch(`/api/boards/${boardId}/cards`);
    const data = await res.json();
    setCards(data);
  }, [boardId]);

  const fetchCardLabels = useCallback(async () => {
    const res = await fetch(`/api/boards/${boardId}/card-labels`);
    const data = await res.json();
    setCardLabelMap(data);
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
    fetchColumns();
    fetchCards();
    fetchCardLabels();
  }, [fetchBoard, fetchColumns, fetchCards, fetchCardLabels]);

  const refreshBoard = () => {
    fetchColumns();
    fetchCards();
    fetchCardLabels();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "card") {
      setActiveCard(active.data.current.card as Card);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;

    if (!over) return;

    // Handle column reorder
    if (active.data.current?.type === "column" && over.data.current?.type === "column") {
      const oldIndex = columns.findIndex(
        (c) => `column-sort-${c.id}` === active.id
      );
      const newIndex = columns.findIndex(
        (c) => `column-sort-${c.id}` === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newColumns = arrayMove(columns, oldIndex, newIndex);
        setColumns(newColumns);
        await fetch("/api/columns/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: newColumns.map((c) => c.id) }),
        });
      }
      return;
    }

    if (!over || active.data.current?.type !== "card") return;

    const draggedCard = active.data.current.card as Card;
    let targetColumnId: number | null = null;

    if (over.data.current?.type === "column") {
      targetColumnId = (over.data.current.column as Column).id;
    } else if (over.data.current?.type === "card") {
      targetColumnId = (over.data.current.card as Card).column_id;
    }

    if (targetColumnId === null) return;

    const targetCards = cards
      .filter((c) => c.column_id === targetColumnId)
      .filter((c) => c.id !== draggedCard.id)
      .sort((a, b) => a.position - b.position);

    let toPosition = targetCards.length;

    if (over.data.current?.type === "card") {
      const overCard = over.data.current.card as Card;
      if (overCard.column_id === targetColumnId) {
        toPosition = overCard.position;
      }
    }

    setCards((prev) =>
      prev.map((c) =>
        c.id === draggedCard.id
          ? { ...c, column_id: targetColumnId!, position: toPosition }
          : c
      )
    );

    await fetch("/api/cards/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: draggedCard.id,
        toColumnId: targetColumnId,
        toPosition,
      }),
    });

    fetchCards();
  };

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
    refreshBoard();
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
    refreshBoard();
  };

  const handleOpenCreateCard = (columnId: number) => {
    setSelectedColumn(columnId);
    setEditingCard(null);
    setCardDialogOpen(true);
  };

  const handleOpenEditCard = (card: Card) => {
    if (activeCard) return; // prevent edit during drag
    setEditingCard(card);
    setSelectedColumn(null);
    setCardDialogOpen(true);
  };

  const handleSaveCard = async (data: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    due_date: string;
  }) => {
    if (editingCard) {
      await fetch(`/api/cards/${editingCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else if (selectedColumn) {
      await fetch(`/api/boards/${boardId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column_id: selectedColumn, ...data }),
      });
    }
    setCardDialogOpen(false);
    setEditingCard(null);
    setSelectedColumn(null);
    refreshBoard();
  };

  const getCardsForColumn = (columnId: number) =>
    cards
      .filter((c) => c.column_id === columnId)
      .sort((a, b) => a.position - b.position);

  if (!board) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <BoardHeader
          name={board.name}
          onRename={handleRenameBoard}
          onDelete={handleDeleteBoard}
        />
        <Button variant="outline" size="sm" onClick={() => setLabelManagerOpen(true)}>
          <Tag className="mr-2 h-4 w-4" />
          Labels
        </Button>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className="flex flex-1 gap-4 overflow-x-auto p-6">
          <SortableContext
            items={columns.map((c) => `column-sort-${c.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((col) => (
              <SortableColumnItem
                key={col.id}
                column={col}
                onRename={handleRenameColumn}
                onDelete={handleDeleteColumn}
                onAddCard={handleOpenCreateCard}
              >
                {getCardsForColumn(col.id).map((card) => (
                  <DraggableCard
                    key={card.id}
                    card={card}
                    labels={cardLabelMap[card.id]}
                    onClick={handleOpenEditCard}
                  />
                ))}
              </SortableColumnItem>
            ))}
          </SortableContext>

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

        <DragOverlay>
          {activeCard ? (
            <KanbanCard
              card={activeCard}
              labels={cardLabelMap[activeCard.id]}
              onClick={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDialog
        open={cardDialogOpen}
        onClose={() => {
          setCardDialogOpen(false);
          setEditingCard(null);
          setSelectedColumn(null);
        }}
        onSave={handleSaveCard}
        initial={editingCard}
      />

      <LabelManager
        open={labelManagerOpen}
        onClose={() => setLabelManagerOpen(false)}
      />
    </div>
  );
}
