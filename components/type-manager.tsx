"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CardType } from "@/lib/db";

export function TypeManager() {
  const [types, setTypes] = useState<CardType[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const fetchTypes = async () => {
    const res = await fetch("/api/types");
    setTypes(await res.json());
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await fetch("/api/types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    setNewName("");
    setNewColor("#6366f1");
    fetchTypes();
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    await fetch(`/api/types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    });
    setEditingId(null);
    fetchTypes();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/types/${id}`, { method: "DELETE" });
    fetchTypes();
  };

  return (
    <div className="space-y-4">
      {types.length === 0 && (
        <p className="text-sm text-muted-foreground">No types yet.</p>
      )}
      {types.map((type) => (
        <div key={type.id} className="flex items-center gap-2">
          {editingId === type.id ? (
            <>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 flex-1"
              />
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border"
              />
              <Button size="sm" onClick={() => handleUpdate(type.id)}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: type.color }} />
                <span className="text-sm">{type.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setEditingId(type.id);
                  setEditName(type.name);
                  setEditColor(type.color);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => handleDelete(type.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      ))}

      <div className="flex items-center gap-2 border-t pt-4">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New type name"
          className="h-8 flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border"
        />
        <Button size="sm" onClick={handleCreate}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}
