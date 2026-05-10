# Launch Checklist: Card Assignee Selection

## Scope

Release optional card assignee selection for create/edit card flows. The feature uses the existing nullable `cards.assignee_id` column, loads existing users from `/api/users`, and displays the assigned user's name on card summaries.

## Pre-Launch Checklist

### Code Quality

- [x] Spec exists: `docs/specs/card-assignee-sdd.md`
- [x] Implementation plan exists: `docs/specs/card-assignee-plan.md`
- [x] API tests cover create/update/clear/reject invalid assignee ids.
- [x] UI tests cover dialog selector, preselected assignee, submitted payload, and card display.
- [x] Focused tests pass: `npm test -- __tests__/s7-card-api.test.ts __tests__/s8-card-ui.test.tsx __tests__/s14-users.test.ts`
- [x] Project tests pass: `npm test -- __tests__`
- [x] Production build passes: `npm run build`
- [x] Code review completed and blocking findings addressed.
- [x] Generated artifacts excluded from merge: `next-env.d.ts`, `data/kanban.db-wal`.
- [ ] Final human approval before merge.

### Security

- [x] `assignee_id` validation rejects non-numeric and non-scalar payloads.
- [x] `assignee_id` validation requires an existing user id.
- [x] SQL writes continue through parameterized `better-sqlite3` statements.
- [x] No secrets or credentials added.
- [ ] Optional: run dependency audit before production deploy: `npm audit --audit-level=high`.

### Data and Migration

- [x] No schema migration required; `cards.assignee_id` already exists.
- [x] Existing unassigned cards remain valid with `assignee_id: null`.
- [x] Clearing assignment is supported with `assignee_id: null`.
- [x] Rollback does not require database rollback.

### Product Behavior

- [x] Create card supports no assignee by default.
- [x] Create card supports assigning an existing user.
- [x] Edit card supports changing or clearing assignee.
- [x] Card summary shows assigned user's name when available.
- [x] Unknown/deleted user references do not crash card rendering.
- [ ] Product owner accepts default behavior: selector lists all users from `/api/users`, not only board members.
- [ ] Product owner accepts card display: assignee name only, no avatar/email.

### Accessibility

- [x] Assignee selector has associated label `Assignee`.
- [x] Dialog remains keyboard-operable through Radix Select.
- [ ] Manual keyboard smoke test in browser: open card dialog, tab to Assignee, select user, save.
- [ ] Manual screen reader smoke test if available.

### Performance

- [x] No new database queries per rendered card; display uses users already loaded on board page.
- [x] Board page adds one `/api/users` request on load.
- [ ] Confirm user count is acceptable for unpaginated `/api/users` in current deployment.

### Release Readiness

- [ ] Merge branch only after all required checklist items are green.
- [ ] Deploy to staging first.
- [ ] Run staging smoke tests.
- [ ] Deploy to production during a monitored window, not Friday afternoon.
- [ ] Assign one person to monitor first hour after deploy.

## Staging Smoke Test

1. Open an existing board.
2. Open Manage -> Users and confirm at least one user exists.
3. Create a new card without assignee.
4. Confirm the card saves and no assignee row is shown.
5. Edit the card and select a user in Assignee.
6. Save and confirm the user's name appears on the card.
7. Reopen the card and confirm the same assignee is selected.
8. Change Assignee to Unassigned.
9. Save and confirm the assignee row disappears.
10. Confirm existing label, priority, due date, and drag/drop flows still work.

## Production Monitoring

Monitor for the first hour after deploy:

- `/api/boards/[id]/cards` POST error rate.
- `/api/cards/[id]` PUT error rate.
- Board page client-side JavaScript errors.
- P95 latency for card create/update endpoints.
- User reports of unable-to-save card, missing assignee, or incorrect assignee display.

## Go/No-Go Criteria

### Go

- [ ] Staging smoke test passes.
- [ ] Production build artifact generated successfully.
- [ ] No generated files included in merge.
- [ ] No critical/high dependency audit findings, or accepted risk documented.
- [ ] Rollback owner and deployment monitor are assigned.

### No-Go

- Any focused test failure.
- Any project test failure under `npm test -- __tests__`.
- Build/typecheck failure.
- Product rejects all-users selector behavior.
- No one available to monitor after deployment.

## Rollback Plan

### Trigger Conditions

Rollback immediately if any of these occur:

- Card create/update error rate exceeds 2x baseline.
- P95 latency for card create/update exceeds 50% over baseline.
- Users cannot create or edit cards.
- Assignee updates corrupt or incorrectly overwrite card data.
- Security issue found in assignee validation or user exposure.

### Rollback Steps

1. Stop rollout or pause deployment pipeline.
2. Revert the feature commit(s): `git revert <commit-sha>`.
3. Deploy the reverted branch/build using the normal deployment process.
4. Verify health check and board page load.
5. Run a production smoke test: create card, edit card, drag/drop card.
6. Confirm `/api/boards/[id]/cards` and `/api/cards/[id]` error rates return to baseline.
7. Notify team that rollback completed and include observed trigger.

### Database Considerations

- No database rollback is required.
- Existing `assignee_id` values can remain in the database; the prior application version already tolerates the column existing and will ignore assignment in UI/API paths.
- If rollback happens after users assigned cards, assignments remain preserved for re-release.

### Time to Rollback

- Code revert and redeploy: target under 10 minutes.
- Database rollback: not applicable.
- User-facing recovery confirmation: target under 15 minutes.

## Post-Launch Verification

Complete within the first hour:

- [ ] Health check or main board page loads successfully.
- [ ] No new server error type in card create/update endpoints.
- [ ] No new client error type in board/card dialog flows.
- [ ] Manual production smoke test creates and edits a card with assignee.
- [ ] Manual production smoke test clears assignee.
- [ ] Logs are accessible and readable.
- [ ] Rollback path confirmed ready with commit SHA identified.
