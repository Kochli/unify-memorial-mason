# Contract — email conversation ↔ customer linking

## Purpose

Define the exact matching rules and persistence contract for automatically linking **email** inbox conversations to `public.customers` by email address.

## Inputs

- Conversation:
  - `inbox_conversations.channel` must be `'email'`
  - `inbox_conversations.primary_handle` is expected to be the canonical counterparty email (see below)
- Customer:
  - `customers.email`

## Canonicalization

### Email normalization

`normalizeEmail(value)`:
- trim whitespace
- lowercase
- must operate on a **bare email** (no display name)

### Header parsing

When deriving a canonical email from Gmail headers:
- Parse RFC5322-ish forms like `Name <email@example.com>`
- Support comma-separated multi-recipient lists in `To`
- Choose the “counterparty” address:
  - inbound: sender (`From`)
  - outbound: first recipient in `To` that is not the user/workshop mailbox email

## Matching rule

Link the conversation to a customer when:

- `normalizeEmail(conversationEmail) == normalizeEmail(customers.email)`
- and the match set size is exactly 1

### Outcomes

- **1 match**:
  - `inbox_conversations.person_id = customers.id`
  - `inbox_conversations.link_state = 'linked'`
  - `link_meta.matched_on = 'email'`
- **0 matches**:
  - keep `person_id = null`
  - `link_state = 'unlinked'`
- **>1 matches**:
  - keep `person_id = null`
  - `link_state = 'ambiguous'`
  - `link_meta.candidates = [customer ids...]`

## Non-goals / constraints

- Do not auto-create customers.
- Do not override existing `person_id`.
- Do not change WhatsApp/SMS linking behavior.

