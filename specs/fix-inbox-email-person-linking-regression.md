# Fix Inbox email→Person linking regression

## Overview

Email conversations in the Unified Inbox are no longer automatically linking to an existing Person/Customer record based on email address. This is a regression: previously, selecting an email conversation would resolve the correct `person` context and show related orders/invoices.

**Context:**
- Unified Inbox supports multiple channels (email/Gmail, WhatsApp, SMS). This change is **scoped to email conversations** and must not break WhatsApp/SMS linking behavior.
- The linking mechanism is expected to set (or derive) `inbox_conversations.person_id` based on a canonical conversation email handle (typically stored on the conversation as `primary_handle` or derivable from messages).
- The system must **not auto-create People**. Linking should only attach an existing Person when there is a match.

**Goal:**
- Restore automatic linking of **email** conversations to the correct Person by matching email address with normalization-safe rules (trim + lowercase).
- Ensure both **existing** unlinked email conversations and **newly synced/imported** email conversations link reliably.

---

## Current State Analysis

### Inbox conversations schema

**Table:** `inbox_conversations`

**Current Structure:**
- Key columns (expected/relevant):
  - `id` (uuid)
  - `channel` (text/enum-like; expected to distinguish email vs WhatsApp/SMS)
  - `person_id` (uuid, nullable; FK to People/Customers table)
  - `primary_handle` (text; canonical “who this conversation is with”, e.g. email address or phone)
  - other metadata (subject/preview/last_message_at/status, etc.)
- Foreign key relationships:
  - `person_id` → People/Customers table (exact table name to confirm)
- Constraints/indexes:
  - Any unique constraint like `(channel, primary_handle)` or similar (to confirm)
- RLS policies:
  - Policies should allow safe updates to `person_id` only when authorized (to confirm)

**Observations:**
- Regression symptom strongly suggests `person_id` is no longer being populated/updated during email ingestion/sync, or `primary_handle` no longer contains a matchable email address.
- If `primary_handle` changed shape (e.g. `"Name <email@x.com>"`, mixed-case, whitespace, multiple recipients), naive equality matching will fail.

### People/Customers schema

**Table:** `people` / `customers` / `persons` (exact name to confirm)

**Current Structure:**
- Key columns (expected/relevant):
  - `id` (uuid)
  - `email` (text, nullable)
  - possibly multiple email fields (e.g. `primary_email`, `emails[]`, `contact_email`)
- Constraints/indexes:
  - Whether email is unique (often it is not), and whether any index exists on normalized email
- RLS policies:
  - Must allow lookup by email for authorized users (to confirm)

**Observations:**
- Matching must be normalization-safe:
  - Trim leading/trailing whitespace
  - Case-insensitive comparison (lowercase)
- If multiple People share the same email, linking must be deterministic (or refuse to link and surface ambiguity); this spec assumes **link only when exactly one match** is found.

### Inbox messages / email ingestion schema

**Table:** `inbox_messages` and/or `gmail_emails` (exact names to confirm)

**Current Structure:**
- Expected message-level fields for email:
  - `conversation_id`/`thread_id`
  - `from_email`, `to_emails`, `cc_emails` (or a raw header blob)
  - `direction` (inbound/outbound)
  - timestamps

**Observations:**
- If conversation-level `primary_handle` is derived from message headers, the regression could be due to:
  - Selecting the wrong address field (e.g. using a “from” that is the workshop’s own address, or using “to” for inbound mail)
  - Storing unparsed RFC5322 strings rather than bare emails
  - A change in which field is considered canonical for the conversation

### Relationship analysis

**Current relationship:**
- `inbox_conversations.person_id` is the primary linkage from a conversation to a Person.
- Related entities (orders/invoices) are expected to be shown in Inbox based on `person_id` (directly or via queries joining through orders).

**Gaps/Issues:**
- Email conversations are missing `person_id` despite there being a Person with a matching email.
- Potential “silent failure” in matching due to lack of normalization or changed field shapes.

### Data access patterns

**How inbox conversations are currently accessed:**
- Frontend queries likely fetch conversation list plus selected conversation details, including `person_id` and/or `primary_handle`.
- Backend/API layer likely provides conversation projections and message threads (to confirm exact API endpoints).

**How People are currently accessed:**
- People/customer context is loaded when a conversation is selected (likely by `person_id`); if `person_id` is null, UI shows “unlinked”.

**How they are queried together (if at all):**
- The correct pattern is:
  - Conversation fetch includes `person_id`
  - UI fetches person/orders/invoices via `person_id`
- A fallback pattern (to consider carefully) is:
  - If `person_id` is null but `primary_handle` is an email, resolve person by email in the API and return it (without mutating DB). This can restore UI context but does not fix persistence unless also backfilled.

---

## Recommended Schema Adjustments

### Database changes

**Migrations required (only if needed after investigation):**
- Add an index to support case-insensitive email matching on People:
  - Example approach: index on `lower(trim(email))` (exact SQL depends on table/column names).
- (Optional) Add a normalized handle column for email conversations:
  - `primary_handle_normalized` = `lower(trim(primary_handle))` for email channel only, or a generated column where supported.

**Non-destructive constraints:**
- Only additive changes (indexes / optional new columns).
- No renames/deletions; maintain backward compatibility.
- Do not add uniqueness constraints unless data is already clean and the product requires it.

### Query/data-access alignment

**Recommended query patterns:**
- Resolve Person for email conversations via normalized comparison:
  - `lower(trim(person.email)) = lower(trim(conversation_email))`
- When deriving `conversation_email`, ensure it is:
  - A bare email address (not `"Name <...>"`)
  - The *external party* in the thread (not the workshop’s own mailbox)

**Recommended display patterns:**
- If `person_id` is set, use existing UI behavior.
- If `person_id` is null but a unique match exists by email, consider showing the resolved person context **and** triggering a safe background link update (preferred: do this in backend sync rather than UI).

---

## Implementation Approach

### Phase 1: Reproduce + pinpoint regression
- Identify the exact code path that used to populate `inbox_conversations.person_id` for email and where it stopped:
  - Conversation creation flow (manual “new conversation”)
  - Gmail sync/import ingestion flow
  - Any shared linking utility that matches `primary_handle` to People
- Confirm what email value is currently stored on conversations/messages:
  - Is `primary_handle` present and email-like?
  - Is it case/whitespace normalized?
  - Is it a parsed email or an RFC5322 formatted string?
- Confirm whether matching is case-sensitive in DB queries or frontend filters.

### Phase 2: Restore reliable email normalization + matching
- Implement (or reintroduce) a **single canonical email normalization function** used for linking:
  - `normalizeEmail(email) = lower(trim(extractBareEmail(email)))`
- Ensure the email source for linking is correct:
  - Prefer message headers derived to the “other party” in the thread.
  - Avoid linking to the workshop’s own inbox address.
- Update the backend ingestion/linking step so that on conversation upsert:
  - If `person_id` is null and `channel = email`, attempt to find a unique Person by normalized email.
  - If exactly one match exists, set `person_id`.
  - If 0 or >1 matches, leave unlinked (no auto-create).

### Phase 3: Backfill existing unlinked email conversations
- Add a one-off, safe backfill path:
  - Prefer a SQL migration or scriptable DB function that:
    - Finds `inbox_conversations` where `channel = email` and `person_id is null`
    - Normalizes the conversation email handle
    - Links to People with a unique matching normalized email
- Ensure this is idempotent and does not overwrite existing links.

### Safety considerations
- Preserve existing linked conversations: never change `person_id` if already set.
- Channel safety: apply linking changes only when `channel` indicates email (unless shared logic is proven safe for other channels).
- Avoid accidental cross-linking:
  - Only link on **unique** Person match.
  - Use robust email extraction to avoid `"Name <...>"` mismatches.
- Testing/verification:
  - Create/identify a Person with an email and an email conversation with that address.
  - Validate:
    - Existing conversation becomes linked after backfill
    - Newly synced/imported conversation links during ingestion
    - UI shows person context + related orders/invoices
- Rollback:
  - Backfill should be reversible by setting `person_id = null` for affected rows if needed (keep a logged list/criteria).

---

## What NOT to Do

- Do not change WhatsApp linking behavior unless the root cause is in shared linking logic and the fix is proven safe for WhatsApp/SMS.
- Do not auto-create new People/Customers from email conversations.
- Do not change inbox layout, filters, tab behavior, or message sending behavior.
- Do not introduce breaking schema changes (no renames/deletes; no non-backward-compatible constraints).

---

## Open Questions / Considerations

- What is the authoritative People table and email field(s) (`people.email` vs `customers.email` vs multiple emails)?
- What is the canonical “external party” email for a thread when there are multiple recipients/participants?
- Do we have to support multiple emails per Person (aliases)? If yes, where are they stored?
- Should linking run synchronously in the sync/import path, or via an asynchronous job/trigger to avoid delaying ingestion?
- Are there any privacy/tenant boundaries (e.g., multi-user inbox) that require scoping the Person lookup by account/workshop?
