"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@/lib/db";

interface UserManagerProps {
  boardId: number;
}

export function UserManager({ boardId }: UserManagerProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [boardUsers, setBoardUsers] = useState<User[]>([]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const fetchData = async () => {
    const [allRes, boardRes] = await Promise.all([
      fetch("/api/users"),
      fetch(`/api/boards/${boardId}/users`),
    ]);
    setAllUsers(await allRes.json());
    setBoardUsers(await boardRes.json());
  };

  useEffect(() => {
    fetchData();
  }, [boardId]);

  const handleCreateUser = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() || undefined }),
    });
    const user = await res.json();
    await fetch(`/api/boards/${boardId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });
    setNewName("");
    setNewEmail("");
    fetchData();
  };

  const handleAddExisting = async (userId: number) => {
    await fetch(`/api/boards/${boardId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    fetchData();
  };

  const handleRemove = async (userId: number) => {
    await fetch(`/api/boards/${boardId}/users?user_id=${userId}`, { method: "DELETE" });
    fetchData();
  };

  const boardUserIds = new Set(boardUsers.map((u) => u.id));
  const usersNotOnBoard = allUsers.filter((u) => !boardUserIds.has(u.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="User name"
          className="h-8 flex-1"
        />
        <Input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email (optional)"
          className="h-8 flex-1"
        />
        <Button size="sm" onClick={handleCreateUser}>
          <Plus className="mr-1 h-3 w-3" /> Add
        </Button>
      </div>

      {boardUsers.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Board Members</p>
          {boardUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between py-1">
              <div>
                <span className="text-sm">{user.name}</span>
                {user.email && (
                  <span className="ml-2 text-xs text-muted-foreground">{user.email}</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => handleRemove(user.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {usersNotOnBoard.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Add Existing Users</p>
          {usersNotOnBoard.map((user) => (
            <div key={user.id} className="flex items-center justify-between py-1">
              <div>
                <span className="text-sm">{user.name}</span>
                {user.email && (
                  <span className="ml-2 text-xs text-muted-foreground">{user.email}</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => handleAddExisting(user.id)}
              >
                Add
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
