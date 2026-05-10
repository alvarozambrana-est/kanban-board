# Spec: Card Assignee Selection

## Objective

Allow users to assign one existing person to a card when creating or updating it.

Success means a card can be saved with no assignee or with a valid user, and the selected assignee persists through API responses, edit dialogs, and board card display.

## Assumptions

1. "Persona" means an existing record from the `users` table.
2. A card can have at most one assignee because the current schema has `cards.assignee_id`.
3. Assignment is optional; unassigned cards remain supported.
4. User creation and board membership are out of scope for this change.
5. No database schema change is needed because `assignee_id` already exists on `cards`.

## Tech Stack

- Next.js App Router with API routes
- TypeScript
- SQLite through `better-sqlite3`
- React client components
- shadcn/Radix Select UI
- Vitest and Testing Library

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Test all: `npm test`
- Test card API: `npm test -- __tests__/s7-card-api.test.ts`
- Test card UI: `npm test -- __tests__/s8-card-ui.test.tsx`
- Test users: `npm test -- __tests__/s14-users.test.ts`

## Project Structure

- `lib/db.ts` contains card/user types and persistence helpers.
- `app/api/boards/[id]/cards/route.ts` creates cards for a board.
- `app/api/cards/[id]/route.ts` updates/deletes cards.
- `components/card-dialog.tsx` captures card fields in create/edit flows.
- `components/kanban-card.tsx` displays card summary information.
- `app/board/[id]/page.tsx` owns board state and passes card save handlers.
- `__tests__/` contains Vitest API and component coverage.

## Code Style

Use existing explicit payload handling and small local state in React components:

```ts
const assigneeId = body.assignee_id === null ? null : Number(body.assignee_id);
const card = updateCard(Number(id), { assignee_id: assigneeId });
```

Conventions:

- Keep API payload names aligned with database columns: `assignee_id`.
- Use `null` for no assignee, not `0` or an empty string in persistence.
- Validate numeric ids before saving.
- Avoid new dependencies.

## Testing Strategy

- API tests verify create and update persist `assignee_id`, reject invalid assignee ids, and allow clearing with `null`.
- UI tests verify the create/edit dialog renders an assignee selector, initializes from the current card, and submits the selected value.
- Existing user tests remain valid because `createCard` already supports `assigneeId`.

## Boundaries

- Always: preserve optional unassigned cards.
- Always: keep `assignee_id` nullable and persist `null` when cleared.
- Always: use existing users from `/api/users` or existing state; do not create users inside card flow.
- Ask first: changing the database schema or supporting multiple assignees.
- Ask first: limiting assignees strictly to board members only if the current UI does not already load board membership.
- Never: delete or rewrite existing card label/type functionality.
- Never: introduce authentication or permissions as part of this change.

## Success Criteria

- Create card API accepts `assignee_id` as a valid user id or `null`/omitted.
- Update card API accepts `assignee_id` as a valid user id or `null` to clear.
- Invalid non-numeric assignee ids are rejected with a 400 response.
- The card dialog exposes an assignee field during create and edit.
- Editing a card preselects its current assignee.
- Saving from the card dialog includes `assignee_id` in the payload.
- Card summary displays the assigned person's name when available.
- Relevant tests pass.

## Open Questions

1. Should the assignee list include all users or only users attached to the current board?
2. Should the card display show only the assignee name, or also avatar/email when available?

## Plan

1. Inspect how board pages currently load users and save cards.
2. Extend card create/update API validation and payload mapping for `assignee_id`.
3. Pass available users into `CardDialog` and add an optional assignee select.
4. Display assignee information on `KanbanCard` using available user data.
5. Add/update API and UI tests for create, update, clear, invalid id, and dialog submission.
6. Run focused tests, then broader relevant test suites.

## Tasks

- [ ] Task: API create/update assignee support
  - Acceptance: card create/update persists, clears, and validates `assignee_id`.
  - Verify: `npm test -- __tests__/s7-card-api.test.ts __tests__/s14-users.test.ts`
  - Files: `app/api/boards/[id]/cards/route.ts`, `app/api/cards/[id]/route.ts`, `__tests__/s7-card-api.test.ts`

- [ ] Task: Card dialog assignee selector
  - Acceptance: create/edit dialog can select unassigned or one existing user and submits `assignee_id`.
  - Verify: `npm test -- __tests__/s8-card-ui.test.tsx`
  - Files: `components/card-dialog.tsx`, relevant caller in `app/board/[id]/page.tsx`, UI tests

- [ ] Task: Card display assignee label
  - Acceptance: cards with assignees show the assigned user's name without breaking existing label/priority/due date UI.
  - Verify: `npm test -- __tests__/s8-card-ui.test.tsx`
  - Files: `components/kanban-card.tsx`, board caller/tests
