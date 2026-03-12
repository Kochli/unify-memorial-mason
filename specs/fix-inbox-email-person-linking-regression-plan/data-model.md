# Data model — fix Inbox email→Person linking regression

## Tables involved

### `public.inbox_conversations`

Relevant columns (observed/assumed from usage):
- `id` uuid pk
- `channel` text (`'email' | 'sms' | 'whatsapp'`)
- `primary_handle` text (email address or phone identifier)
- `person_id` uuid null (FK → `public.customers.id`)
- `link_state` text (`linked` | `unlinked` | `ambiguous`)
- `link_meta` jsonb (metadata such as `matched_on`, candidate ids)

### `public.customers`

Relevant columns:
- `id` uuid pk
- `email` text null
- `phone` text null

Indexing:
- There is an existing migration adding `customers_email_lower_idx` on `lower(email)`:
  - `supabase/migrations/20260304130000_inbox_customers_email_link_backfill.sql`

### `public.inbox_messages`

Relevant columns (from Edge Function inserts):
- `conversation_id` uuid fk
- `channel` text
- `direction` text (`inbound` | `outbound`)
- `from_handle` text (email)
- `to_handle` text (email)
- `meta` jsonb (contains gmail `messageId`/`threadId`)

## Linking invariants (required)

- `inbox_conversations.person_id` is the persistent link; UI uses it directly.
- Email linking must:
  - only set `person_id` when `channel='email'`
  - match `customers.email` using a normalization-safe rule:
    - `lower(trim(conversation_email)) = lower(trim(customers.email))`
  - be idempotent:
    - never override an existing `person_id`
  - avoid auto-linking ambiguous matches:
    - if 0 matches → remain unlinked
    - if >1 matches → set `link_state='ambiguous'` and keep `person_id` null

## Canonical email definition (recommended)

For `channel='email'`, the canonical “counterparty email” should be:
- a **single** bare email address
- derived as:
  - inbound: first parsed `From` address
  - outbound: first parsed `To` address that is not the user/workshop email (fallback: first `To`)

