"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface BoardHeaderProps {
  name: string;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function BoardHeader({ name: initialName, onRename, onDelete }: BoardHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);

  const handleSave = () => {
    if (name.trim() && name.trim() !== initialName) {
      onRename(name.trim());
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setName(initialName);
      setEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Link href="/">
        <Button variant="ghost" size="icon" aria-label="Back to boards">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      {editing ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-9 w-64 text-xl font-bold"
          autoFocus
        />
      ) : (
        <h1
          className="cursor-pointer text-2xl font-bold"
          onDoubleClick={() => setEditing(true)}
        >
          {initialName}
        </h1>
      )}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditing(!editing)}
          aria-label="Rename board"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete board"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
