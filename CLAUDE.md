# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Memorial Mason Management - a business management application for memorial masons built with React, TypeScript, Vite, and Supabase. The app includes a dashboard with unified inbox, order management, map views, invoicing, and reporting features.

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start development server with hot reload
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui components, Tailwind CSS, Radix UI primitives
- **State/Data**: TanStack React Query, React Hook Form + Zod validation
- **Backend**: Supabase (PostgreSQL database, Edge Functions, Auth)
- **Routing**: React Router DOM v6 with nested routes
- **Maps**: Google Maps API (`@googlemaps/js-api-loader`)

## Architecture

### Frontend Structure

- `src/pages/` - Route components. `Dashboard.tsx` is the shell with nested routes for `inbox`, `map`, `orders`, `invoicing`, `reporting`
- `src/components/` - Reusable components. `ui/` contains shadcn/ui primitives
- `src/integrations/supabase/` - Supabase client and auto-generated database types
- `src/hooks/` - Custom React hooks (`use-mobile`, `use-toast`)
- `src/lib/utils.ts` - Utility functions including `cn()` for className merging

### Backend Structure

- `supabase/functions/` - Deno-based Edge Functions (gmail-oauth, gmail-sync)
- `supabase/migrations/` - Database migration files
- `supabase/config.toml` - Supabase project configuration

### Database Tables

- `gmail_accounts` - OAuth tokens for connected Gmail accounts
- `gmail_emails` - Synced email messages with thread/label info

## Supabase Conventions

### Migrations
- File format: `YYYYMMDDHHmmss_short_description.sql`
- Always enable RLS on new tables
- Create separate policies for each operation (select, insert, update, delete) and role (anon, authenticated)
- Use lowercase SQL keywords

### Edge Functions
- Use `Deno.serve()` (not the deprecated `serve` from std)
- Import npm packages with `npm:` prefix and version (e.g., `npm:express@4.18.2`)
- Pre-populated env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`
- Shared utilities go in `supabase/functions/_shared/`

### Database Functions
- Default to `SECURITY INVOKER`
- Always set `search_path = ''` and use fully qualified table names
- Use `IMMUTABLE` or `STABLE` where possible

### RLS Policies
- Use `(select auth.uid())` instead of `auth.uid()` directly for performance
- SELECT: use USING, no WITH CHECK
- INSERT: use WITH CHECK, no USING
- UPDATE: use both USING and WITH CHECK
- DELETE: use USING, no WITH CHECK

## Import Aliases

Use `@/` for absolute imports from `src/`:
```typescript
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
```
