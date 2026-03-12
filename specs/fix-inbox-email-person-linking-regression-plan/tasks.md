# Tasks — fix Inbox email→Person linking regression

## Phase 0 — confirm current behavior (investigation)

- [X] Inspect `supabase/functions/inbox-gmail-sync/index.ts`
  - [X] Confirm `primary_handle` values in DB for recent outbound/inbound email threads (bare email vs list vs display format)
  - [X] Confirm `attemptAutoLink` behavior and whether it is being invoked for both inbound and outbound messages
- [X] Inspect `supabase/functions/inbox-gmail-new-thread/index.ts`
  - [X] Confirm conversations created here remain unlinked (no auto-link call)
- [X] Inspect frontend usage
  - [X] Confirm UI relies purely on `conversation.person_id` (`ConversationView.tsx`, `UnifiedInboxPage.tsx`)

## Phase 1 — implement the fix (backend, minimal + safe)

- [X] Add shared email parsing + normalization helper
  - [X] Create `supabase/functions/_shared/email.ts`:
    - parse header strings into `string[]` addresses
    - normalize email (`trim + lowercase`)
    - choose counterparty email deterministically
- [X] Update Gmail sync to store canonical email in `primary_handle`
  - [X] Use parsed address lists for `From` and `To`
  - [X] Ensure `primary_handle` becomes a single bare email string
  - [X] Keep `attemptAutoLink` idempotent; only link when `person_id` is null
- [X] Update outbound new-thread creation to auto-link
  - [X] After inserting `inbox_conversations`, attempt auto-link for `channel='email'`
  - [X] Use the same canonical email selection logic as sync

## Phase 2 — data repair (only if necessary)

- [X] Decide if backfill is needed based on real data:
  - if many rows have `primary_handle` containing comma lists or `Name <...>` and remain unlinked:
    - [ ] Add a targeted migration to link where email can be safely extracted
    - [ ] Ensure it’s idempotent and does not overwrite existing `person_id`

## Phase 3 — validation

- [ ] Existing conversations:
  - [ ] case-only email differences still link
  - [ ] whitespace differences still link
  - [ ] multi-recipient outbound threads do not mis-link (leave unlinked if ambiguous)
- [ ] New conversations:
  - [ ] new outbound thread created via UI/Edge Function links immediately when recipient matches
- [ ] No regressions:
  - [ ] WhatsApp/SMS linking unchanged
  - [ ] Inbox list filtering and loading unchanged

