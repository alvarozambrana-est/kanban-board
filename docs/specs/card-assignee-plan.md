# Implementation Plan: Card Assignee Selection

## Overview

Add optional assignee support to the card create/edit flow using the existing `cards.assignee_id` column and existing `users` records. The implementation is sliced vertically so each task leaves one user-visible or API-visible path working and verified.

## Architecture Decisions

- Reuse the existing nullable `cards.assignee_id` schema instead of adding tables or migrations.
- Use `assignee_id` in API payloads to match current database field naming.
- Represent an unassigned card as `null` in persistence and API responses.
- Keep assignee selection limited to existing users loaded by the board page; user management remains in `BoardManager`.
- Defer the open question of "all users vs board users only" to implementation kickoff. If unresolved, use all users because `/api/users` already exists and requires no new route.

## Dependency Graph

```text
Existing cards.assignee_id column
  -> DB helper support in createCard/updateCard (already present)
  -> API request validation and payload mapping
  -> Board page loads users and includes assignee_id in saves
  -> CardDialog renders/selects assignee
  -> KanbanCard receives user lookup and displays assignee
  -> API/UI tests verify persistence and user behavior
```

## Task List

### Phase 1: API Slice

## Task 1: Create Cards With Optional Assignee

**Description:** Extend the create-card API path so a caller can create a card with no assignee or one valid existing user id. This delivers the first vertical slice from request payload to persisted card response.

**Acceptance criteria:**

- [ ] `POST /api/boards/[id]/cards` accepts omitted `assignee_id` and returns `assignee_id: null`.
- [ ] `POST /api/boards/[id]/cards` accepts a numeric valid user id and returns that id as `assignee_id`.
- [ ] `POST /api/boards/[id]/cards` rejects non-numeric `assignee_id` with HTTP 400.

**Verification:**

- [ ] Tests pass: `npm test -- __tests__/s7-card-api.test.ts`
- [ ] Existing user/card helper coverage remains passing: `npm test -- __tests__/s14-users.test.ts`

**Dependencies:** None

**Files likely touched:**

- `app/api/boards/[id]/cards/route.ts`
- `__tests__/s7-card-api.test.ts`

**Estimated scope:** Small: 2 files

## Task 2: Update and Clear Card Assignee

**Description:** Extend the update-card API path so an existing card can change assignee or clear assignment. This completes the API write contract needed by the edit UI.

**Acceptance criteria:**

- [ ] `PUT /api/cards/[id]` accepts a numeric valid user id and returns that id as `assignee_id`.
- [ ] `PUT /api/cards/[id]` accepts `assignee_id: null` and returns `assignee_id: null`.
- [ ] `PUT /api/cards/[id]` rejects non-numeric `assignee_id` with HTTP 400.

**Verification:**

- [ ] Tests pass: `npm test -- __tests__/s7-card-api.test.ts`
- [ ] Existing users/card metadata tests pass: `npm test -- __tests__/s14-users.test.ts`

**Dependencies:** Task 1

**Files likely touched:**

- `app/api/cards/[id]/route.ts`
- `__tests__/s7-card-api.test.ts`

**Estimated scope:** Small: 2 files

### Checkpoint: API Contract

- [ ] `npm test -- __tests__/s7-card-api.test.ts __tests__/s14-users.test.ts`
- [ ] API responses preserve existing card fields: title, description, priority, due date, type, author.
- [ ] Human review confirms validation behavior for unknown but numeric user ids if implemented as numeric-only validation.

### Phase 2: Create/Edit UI Slice

## Task 3: Select Assignee in Card Dialog

**Description:** Add an optional assignee selector to `CardDialog` and include `assignee_id` in the submitted form data. This slice is component-level and can be verified without wiring board data yet.

**Acceptance criteria:**

- [ ] Create mode defaults to unassigned and submits `assignee_id: null`.
- [ ] Edit mode preselects `initial.assignee_id` when present.
- [ ] Selecting a user submits that user's numeric id as `assignee_id`.

**Verification:**

- [ ] Tests pass: `npm test -- __tests__/s8-card-ui.test.tsx`
- [ ] Manual check: opening the dialog shows an "Assignee" field with an unassigned option.

**Dependencies:** Tasks 1-2 define the API payload contract.

**Files likely touched:**

- `components/card-dialog.tsx`
- `__tests__/s8-card-ui.test.tsx`

**Estimated scope:** Small: 2 files

## Task 4: Wire Board Save Flow to Assignee Data

**Description:** Load available users on the board page, pass them into `CardDialog`, and send the selected `assignee_id` through create and update fetch calls. This creates the end-to-end UI write path.

**Acceptance criteria:**

- [ ] Board page loads users once with the existing API and stores them in local state.
- [ ] Creating a card sends `assignee_id` with the card payload.
- [ ] Editing a card sends `assignee_id` with the card payload.

**Verification:**

- [ ] Tests pass: `npm test -- __tests__/s8-card-ui.test.tsx`
- [ ] Manual check: create a card with an assignee, reopen it, and the same assignee is selected.

**Dependencies:** Task 3

**Files likely touched:**

- `app/board/[id]/page.tsx`
- `components/card-dialog.tsx`
- `__tests__/s8-card-ui.test.tsx`

**Estimated scope:** Medium: 3 files

### Checkpoint: Create/Edit Flow

- [ ] `npm test -- __tests__/s7-card-api.test.ts __tests__/s8-card-ui.test.tsx __tests__/s14-users.test.ts`
- [ ] Card create/edit still works when there are no users.
- [ ] Existing priority, description, due date, labels, and drag behavior remain unaffected.

### Phase 3: Display Slice

## Task 5: Show Assignee on Card Summary

**Description:** Display the assigned person's name on each card when `assignee_id` has a matching loaded user. This completes the visible feedback loop after assignment.

**Acceptance criteria:**

- [ ] A card with a matching assignee displays that user's name.
- [ ] A card without an assignee does not show an assignee row.
- [ ] A card with an unknown `assignee_id` does not crash rendering.

**Verification:**

- [ ] Tests pass: `npm test -- __tests__/s8-card-ui.test.tsx`
- [ ] Manual check: assigned and unassigned cards remain visually readable in each column.

**Dependencies:** Task 4

**Files likely touched:**

- `components/kanban-card.tsx`
- `components/draggable-card.tsx`
- `app/board/[id]/page.tsx`
- `__tests__/s8-card-ui.test.tsx`

**Estimated scope:** Medium: 4 files

## Task 6: Final Regression Verification

**Description:** Run focused and broader verification for card assignment and adjacent card/board behavior. This is a verification-only slice to catch regressions before handoff.

**Acceptance criteria:**

- [ ] Focused API and UI test suites pass.
- [ ] Full Vitest suite passes or any unrelated failures are documented.
- [ ] Production build succeeds or any unrelated build issue is documented.

**Verification:**

- [ ] `npm test -- __tests__/s7-card-api.test.ts __tests__/s8-card-ui.test.tsx __tests__/s14-users.test.ts`
- [ ] `npm test`
- [ ] `npm run build`

**Dependencies:** Tasks 1-5

**Files likely touched:** None unless verification reveals defects.

**Estimated scope:** XS: verification only

### Checkpoint: Complete

- [ ] All card-assignee success criteria in `docs/specs/card-assignee-sdd.md` are met.
- [ ] All new and existing focused tests pass.
- [ ] Any unresolved product decisions are documented in the final response.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing tests use partial `Card` objects missing newer nullable fields | Medium | Update test fixtures minimally to include `type_id`, `author_id`, and `assignee_id` only where TypeScript requires it. |
| Radix Select cannot use an empty string value for unassigned | Medium | Use a sentinel value such as `unassigned` in UI state and convert to `null` at submit. |
| Loading all users may not match expected board-only assignment | Medium | Confirm product decision before implementation; if not confirmed, document all-users behavior. |
| Numeric user id validation may allow deleted/nonexistent users until SQLite FK rejects writes | Low | Prefer checking id shape in route and let FK/database failure surface as 500 only if existing project patterns do that; otherwise add explicit `getUserById` validation. |

## Parallelization Opportunities

- Tasks 1 and 2 should be sequential because they define one API contract.
- Task 3 can start after the API contract is agreed, even before Task 4.
- Task 5 should wait for Task 4 because it needs the chosen user-loading shape.
- Task 6 must be last.

## Open Questions

- Should the selector list all users from `/api/users` or only users attached to the current board?
- Should the card summary show only assignee name, or include avatar/email if available?
