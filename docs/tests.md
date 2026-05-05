# Test Mapping Document

Each test file maps to one spec. Status: ⬜ pending | 🟡 in_progress | ✅ passing

All 12 specs completed — 137 tests passing.

| Spec | Test File | Test Cases | Status |
|------|-----------|------------|--------|
| S1 | `__tests__/s1-scaffold.test.ts` | Project builds, dev server starts, vitest runs, deps installed | ✅ |
| S2 | `__tests__/s2-database.test.ts` | DB file created, tables exist, CRUD helpers work, migrations run | ✅ |
| S3 | `__tests__/s3-board-api.test.ts` | GET/POST/PUT/DELETE boards, validation, error handling | ✅ |
| S4 | `__tests__/s4-board-ui.test.tsx` | Board list renders, create/edit/delete dialogs, navigation | ✅ |
| S5 | `__tests__/s5-column-api.test.ts` | GET/POST/PUT/DELETE columns, reorder, cascade delete | ✅ |
| S6 | `__tests__/s6-column-ui.test.tsx` | Columns render on board, add/edit/delete column | ✅ |
| S7 | `__tests__/s7-card-api.test.ts` | CRUD cards, priority validation, due_date, move | ✅ |
| S8 | `__tests__/s8-card-ui.test.tsx` | Card rendering, create/edit dialog, priority/due date display | ✅ |
| S9 | `__tests__/s9-dragdrop.test.tsx` | Drag card between columns, position update, API persistence | ✅ |
| S10 | `__tests__/s10-labels.test.tsx` | Label CRUD, assign/remove labels from cards, color badges | ✅ |
| S11 | `__tests__/s11-reorder.test.tsx` | Card reorder within column, column reorder, position integrity | ✅ |
| S12 | `__tests__/s12-integration.test.ts` | Full flow: board → columns → cards → labels → drag → verify | ✅ |
