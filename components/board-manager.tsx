"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserManager } from "@/components/user-manager";
import { TypeManager } from "@/components/type-manager";
import { LabelManager } from "@/components/label-manager";

interface BoardManagerProps {
  open: boolean;
  onClose: () => void;
  boardId: number;
}

type Tab = "users" | "labels" | "types";

export function BoardManager({ open, onClose, boardId }: BoardManagerProps) {
  const [tab, setTab] = useState<Tab>("users");

  const tabs: { id: Tab; label: string }[] = [
    { id: "users", label: "Users" },
    { id: "labels", label: "Labels" },
    { id: "types", label: "Types" },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Board</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 border-b pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-[200px]">
          {tab === "users" && <UserManager boardId={boardId} />}
          {tab === "labels" && <LabelManager open={true} onClose={() => {}} boardId={boardId} />}
          {tab === "types" && <TypeManager />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
