"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Column } from "@/lib/db";

interface KanbanColumnProps {
  column: Column;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onAddCard: (columnId: number) => void;
  children?: React.ReactNode;
}

export function KanbanColumn({ column, onRename, onDelete, onAddCard, children }: KanbanColumnProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);

  const handleRename = () => {
    if (name.trim() && name.trim() !== column.name) {
      onRename(column.id, name.trim());
    }
    setEditing(false);
  };

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b px-3 py-2">
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <h3
            className="cursor-pointer text-sm font-semibold"
            onDoubleClick={() => setEditing(true)}
          >
            {column.name}
          </h3>
        )}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setEditing(!editing)}
            aria-label={`Rename ${column.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(column.id)}
            aria-label={`Delete ${column.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {children}
      </div>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          size="sm"
          onClick={() => onAddCard(column.id)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Card
        </Button>
      </div>
    </div>
  );
}
