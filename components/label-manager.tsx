"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { Label } from "@/lib/db";

interface LabelManagerProps {
  open: boolean;
  onClose: () => void;
  boardId: number;
}

export function LabelManager({ open, onClose, boardId }: LabelManagerProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const fetchLabels = async () => {
    const res = await fetch(`/api/boards/${boardId}/labels`);
    const data = await res.json();
    setLabels(data);
  };

  useEffect(() => {
    if (open) fetchLabels();
  }, [open, boardId]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await fetch(`/api/boards/${boardId}/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    setNewName("");
    setNewColor("#6366f1");
    fetchLabels();
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    await fetch(`/api/labels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    });
    setEditingId(null);
    fetchLabels();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/labels/${id}`, { method: "DELETE" });
    fetchLabels();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Labels</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {labels.length === 0 && (
            <p className="text-sm text-muted-foreground">No labels yet. Create one below.</p>
          )}
          {labels.map((label) => (
            <div key={label.id} className="flex items-center gap-2">
              {editingId === label.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate(label.id)}
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border"
                  />
                  <Button size="sm" onClick={() => handleUpdate(label.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm">{label.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingId(label.id);
                      setEditName(label.name);
                      setEditColor(label.color);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(label.id)}
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
              placeholder="New label name"
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
      </DialogContent>
    </Dialog>
  );
}
