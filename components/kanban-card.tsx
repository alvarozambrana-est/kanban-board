"use client";

import { Calendar, User as UserIcon } from "lucide-react";
import { LabelBadge } from "@/components/label-badge";
import type { Card, Label, User } from "@/lib/db";

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

const priorityLabels: Record<string, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

interface KanbanCardProps {
  card: Card;
  labels?: Label[];
  users?: User[];
  onClick: (card: Card) => void;
}

export function KanbanCard({ card, labels, users = [], onClick }: KanbanCardProps) {
  const isOverdue =
    card.due_date && new Date(card.due_date) < new Date() && !card.due_date.includes("T00:00");
  const assignee = users.find((user) => user.id === card.assignee_id);

  return (
    <div
      onClick={() => onClick(card)}
      className="cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{card.title}</p>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${priorityColors[card.priority] || priorityColors.medium}`}
        >
          {priorityLabels[card.priority] || "Med"}
        </span>
      </div>

      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{card.description}</p>
      )}

      {card.due_date && (
        <div
          className={`mt-2 flex items-center gap-1 text-xs ${
            isOverdue ? "text-red-600" : "text-muted-foreground"
          }`}
        >
          <Calendar className="h-3 w-3" />
          <span>{card.due_date}</span>
        </div>
      )}

      {assignee && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <UserIcon className="h-3 w-3" />
          <span>{assignee.name}</span>
        </div>
      )}

      {labels && labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {labels.map((label) => (
            <LabelBadge key={label.id} name={label.name} color={label.color} />
          ))}
        </div>
      )}
    </div>
  );
}
