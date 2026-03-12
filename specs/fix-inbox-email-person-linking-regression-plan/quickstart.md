# Quickstart — fix Inbox email→Person linking regression

## What to verify first

- Pick a known customer in `public.customers` with a real email (e.g. `customer@example.com`).
- Identify at least one inbox email conversation that should match that email but currently has:
  - `channel='email'`
  - `person_id is null`

## Repro checklist (current bug)

- Open Unified Inbox
- Select the email conversation
- Observe:
  - conversation shows `primary_handle` but person context is missing
  - orders/invoices panel is empty (because `person_id` is null)

## Expected after fix

- That same conversation has `person_id` populated and `link_state='linked'`.
- Inbox shows customer name/email and related orders/invoices as before.
- New outbound “new thread” email conversations link immediately when the recipient matches an existing customer email.

## Implementation smoke checks

- Confirm `primary_handle` is a single bare email, not:
  - `"Name <email@x.com>"`
  - `"a@b.com, c@d.com"`
- Confirm linking is normalization-safe:
  - case differences link correctly
  - leading/trailing whitespace does not break linking

