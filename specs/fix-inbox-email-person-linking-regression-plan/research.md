# Research — fix Inbox email→Person linking regression

## Summary of the regression

Email conversations are not linking to `customers` (People) by email address, which prevents the Inbox UI from showing person context and related orders/invoices.

The linking is persisted via `public.inbox_conversations.person_id`. The Inbox UI uses `person_id` directly; there is no reliable email fallback in the UI.

## Key code paths inspected

### Gmail ingestion / sync

- `supabase/functions/inbox-gmail-sync/index.ts`
  - Derives `primaryHandle` based on direction:
    - inbound: `From` email
    - outbound: `To` email
  - Creates/updates `public.inbox_conversations.primary_handle = primaryHandle`
  - Attempts auto-link via `attemptAutoLink(..., "email", primaryHandle)`

### Outbound “new thread” creation

- `supabase/functions/inbox-gmail-new-thread/index.ts`
  - Creates `inbox_conversations` with `primary_handle = trimmedTo`
  - **Does not** attempt auto-link

### Auto-link logic

- `attemptAutoLink` exists in:
  - `supabase/functions/inbox-gmail-sync/index.ts` (email uses `ilike`)
  - `supabase/functions/twilio-sms-webhook/index.ts` (email uses `eq`, phone uses `eq`)

The email and phone linking logic has diverged across functions; that increases regression risk.

## What likely changed / why matching fails

### 1) `primary_handle` is no longer reliably a bare single email

In `inbox-gmail-sync`, header parsing uses a simplified extraction that:
- pulls `<email>` if present
- otherwise returns the entire header string
- does **not** handle comma-separated multi-recipient `To` headers

That means outbound-derived `primary_handle` may become:
- a list: `"a@b.com, c@d.com"`
- a group/alias string that isn’t a bare address

Since customer matching is an exact comparison (case-insensitive but still exact), these values won’t match `customers.email`.

### 2) Missing auto-link on the outbound “new thread” path

