"use client";

import { useDroppable } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/kanban-column";
import type { Column } from "@/lib/db";

interface DroppableColumnProps {
  column: Column;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onAddCard: (columnId: number) => void;
  children?: React.ReactNode;
}

export function DroppableColumn({
  column,
  onRename,
  onDelete,
  onAddCard,
  children,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", column },
  });

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 rounded-lg transition-colors ${
        isOver ? "ring-2 ring-primary" : ""
      }`}
    >
      <KanbanColumn
        column={column}
        onRename={onRename}
        onDelete={onDelete}
        onAddCard={onAddCard}
      >
        {children}
      </KanbanColumn>
    </div>
  );
}
