# Kanban Board App — Software Design Document

**Date**: 2026-05-04
**Stack**: Next.js (App Router) + TypeScript + SQLite (better-sqlite3) + Tailwind CSS + shadcn/ui + Vitest

---

## Architecture

```
Next.js App Router (RSC + API Routes)
├── app/
│   ├── layout.tsx          (root layout, providers)
│   ├── page.tsx            (board list → "/")
│   ├── board/[id]/page.tsx (kanban board → "/board/[id]")
│   └── api/
│       ├── boards/         CRUD
│       ├── columns/        CRUD + reorder
│       ├── cards/          CRUD + reorder
│       └── labels/         CRUD
├── lib/
│   └── db.ts               (better-sqlite3 singleton + migrations)
├── components/
│   ├── ui/                 (shadcn components)
│   ├── board-list.tsx
│   ├── board-dialog.tsx
│   ├── kanban-column.tsx
│   ├── kanban-card.tsx
│   ├── card-dialog.tsx
│   ├── label-badge.tsx
│   └── label-manager.tsx
└── __tests__/              (Vitest unit + component tests)
```

## Database Schema

```sql
CREATE TABLE boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE columns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  priority TEXT CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE labels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE TABLE card_labels (
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);
```

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET / POST | `/api/boards` | List all boards / Create board |
| GET / PUT / DELETE | `/api/boards/[id]` | Read / Update / Delete board |
| GET / POST | `/api/boards/[id]/columns` | List / Create columns for board |
| PUT / DELETE | `/api/columns/[id]` | Update / Delete column |
| PUT | `/api/columns/reorder` | Reorder columns |
| GET / POST | `/api/boards/[id]/cards` | List / Create cards for board |
| PUT / DELETE | `/api/cards/[id]` | Update / Delete card |
| PUT | `/api/cards/reorder` | Move card to new column+position |
| GET / POST / PUT / DELETE | `/api/labels` | Label CRUD |
| POST / DELETE | `/api/cards/[id]/labels` | Assign / Remove label |

## Component Tree

```
RootLayout
└── BoardListPage
    ├── BoardCard (×N)
    └── CreateBoardButton → BoardDialog

KanbanBoardPage
├── BoardHeader (name, edit, delete)
├── LabelManager (create/edit/delete labels)
└── Columns (horizontal scroll)
    └── KanbanColumn (×N)
        ├── ColumnHeader (name, edit, delete, add card)
        └── KanbanCard (×N)
            ├── PriorityBadge
            ├── LabelBadge (×N)
            ├── DueDateBadge
            └── CardDialog (edit modal)
```

## Incremental Specs

| # | Spec | Description |
|---|------|-------------|
| S1 | Project scaffold | Next.js + TS + Tailwind + shadcn + Vitest + better-sqlite3 + folder structure |
| S2 | Database layer | Schema + migration + db.ts singleton with helpers |
| S3 | Board API | Full CRUD routes for boards |
| S4 | Board UI | Board list page, create/edit/delete dialogs |
| S5 | Column API | CRUD + reorder for columns within a board |
| S6 | Column UI | Columns rendered on board page, add/edit/delete |
| S7 | Card API | Full CRUD with priority, due_date |
| S8 | Card UI | Cards in columns, create/edit dialog, priority/due date display |
| S9 | Drag & Drop | @dnd-kit integration, card moves persist to API |
| S10 | Labels API + UI | Label CRUD, assign/remove from cards, color badges |
| S11 | Reordering | Card reorder within column, column reorder |
| S12 | Integration + Polish | End-to-end flows, edge cases, final cleanup |
