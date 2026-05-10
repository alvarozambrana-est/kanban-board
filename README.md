# Kanban Board

A local kanban board app built with Next.js App Router, TypeScript, SQLite, Tailwind CSS, shadcn-style UI components, and Vitest. It supports multiple boards, columns, draggable cards, labels, users, card types, search, and CSV/TSV export.

## Features

- Create, rename, and delete boards.
- Add, rename, delete, and reorder columns.
- Create, edit, drag, and reorder cards across columns.
- Track card priority and due dates.
- Manage board-scoped labels and users.
- Manage global card types.
- Search cards by text, board, type, assignee, author, and priority.
- Export board cards as CSV or TSV.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- SQLite via `better-sqlite3`
- Tailwind CSS 4
- Radix UI primitives and local `components/ui` wrappers
- `@dnd-kit` for drag and drop
- Vitest, Testing Library, and Playwright

## Project Structure

```text
app/                  Next.js routes, pages, and API handlers
app/api/              REST-style API routes for boards, columns, cards, labels, users, types, search, export
components/           Client UI components and board/card managers
components/ui/        Reusable UI primitives
lib/db.ts             SQLite connection, schema, migrations, and data helpers
lib/utils.ts          Shared utility helpers
__tests__/            Vitest unit and component tests
e2e/                  Playwright tests
docs/                 Design, test mapping, and progress history
data/                 Local SQLite database files, created at runtime
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

The app creates the SQLite database automatically at `data/kanban.db` when the database is first accessed. Runtime database files are ignored by Git.

## Scripts

```bash
npm run dev        # Start the Next.js development server
npm run build      # Build the app
npm run start      # Start the production server
npm run test       # Run Vitest once
npm run test:watch # Run Vitest in watch mode
```

Playwright is configured in `playwright.config.ts` and uses `npm run dev` as its web server. Run it directly with:

```bash
npx playwright test
```

## API Overview

- `GET /api/boards`, `POST /api/boards`
- `GET /api/boards/:id`, `PUT /api/boards/:id`, `DELETE /api/boards/:id`
- `GET /api/boards/:id/columns`, `POST /api/boards/:id/columns`
- `PUT /api/columns/:id`, `DELETE /api/columns/:id`, `PUT /api/columns/reorder`
- `GET /api/boards/:id/cards`, `POST /api/boards/:id/cards`
- `PUT /api/cards/:id`, `DELETE /api/cards/:id`, `PUT /api/cards/reorder`
- `GET /api/boards/:id/labels`, `POST /api/labels`, `PUT /api/labels/:id`, `DELETE /api/labels/:id`
- `POST /api/cards/:id/labels`, `DELETE /api/cards/:id/labels`
- `GET /api/boards/:id/card-labels`
- `GET /api/boards/:id/users`, `POST /api/boards/:id/users`, `DELETE /api/boards/:id/users`
- `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`
- `GET /api/types`, `POST /api/types`, `PUT /api/types/:id`, `DELETE /api/types/:id`
- `GET /api/search`
- `GET /api/boards/:id/export?format=csv|tsv`

## Documentation

- `docs/specs/kanban-sdd.md` contains the original software design document.
- `docs/tests.md` maps implemented specs to test files.
- `docs/history.md` records completed implementation milestones.

## Notes

- `lib/db.ts` owns the SQLite schema and lightweight migrations.
- `next.config.ts` marks `better-sqlite3` as a server external package.
- The default database path is `data/kanban.db`; tests can override it through `setDbPath`.
