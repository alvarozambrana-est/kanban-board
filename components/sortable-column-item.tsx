"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DroppableColumn } from "@/components/droppable-column";
import type { Column } from "@/lib/db";

interface SortableColumnItemProps {
  column: Column;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onAddCard: (columnId: number) => void;
  children?: React.ReactNode;
}

export function SortableColumnItem({
  column,
  onRename,
  onDelete,
  onAddCard,
  children,
}: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-sort-${column.id}`,
    data: { type: "column", column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DroppableColumn
        column={column}
        onRename={onRename}
        onDelete={onDelete}
        onAddCard={onAddCard}
      >
        <div {...listeners} className="cursor-grab">
          {children}
        </div>
      </DroppableColumn>
    </div>
  );
}
