"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Card, User } from "@/lib/db";

const UNASSIGNED_VALUE = "unassigned";

interface CardDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    due_date: string;
    assignee_id: number | null;
  }) => void;
  initial?: Card | null;
  users?: User[];
}

export function CardDialog({ open, onClose, onSave, initial, users = [] }: CardDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeValue, setAssigneeValue] = useState(UNASSIGNED_VALUE);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setDescription(initial.description || "");
      setPriority(initial.priority);
      setDueDate(initial.due_date || "");
      setAssigneeValue(initial.assignee_id ? String(initial.assignee_id) : UNASSIGNED_VALUE);
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setAssigneeValue(UNASSIGNED_VALUE);
    }
    setError("");
  }, [initial, open]);

  const handleSave = () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate,
      assignee_id: assigneeValue === UNASSIGNED_VALUE ? null : Number(assigneeValue),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Card" : "Create Card"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="card-title">Title</Label>
            <Input
              id="card-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              placeholder="Enter card title"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-desc">Description</Label>
            <Textarea
              id="card-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger id="card-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-due">Due Date</Label>
            <Input
              id="card-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-assignee">Assignee</Label>
            <Select value={assigneeValue} onValueChange={setAssigneeValue}>
              <SelectTrigger id="card-assignee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{initial ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
