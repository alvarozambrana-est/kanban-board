"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard } from "@/components/kanban-card";
import type { Card, Label, User } from "@/lib/db";

interface DraggableCardProps {
  card: Card;
  labels?: Label[];
  users?: User[];
  onClick: (card: Card) => void;
}

export function DraggableCard({ card, labels, users, onClick }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${card.id}`,
    data: { type: "card", card },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <KanbanCard card={card} labels={labels} users={users} onClick={onClick} />
    </div>
  );
}
