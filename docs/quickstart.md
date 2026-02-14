# Quickstart

## AI suggested reply (localhost without Supabase login)

The `inbox-ai-suggest-reply` Edge Function can work without a Supabase Auth session by using a temporary internal key. **Use this only for local development until real login is implemented.**

### Setup

1. **Set the secret for the Edge Function**
   ```bash
   supabase secrets set INTERNAL_FUNCTION_KEY=<your-secret>
   ```

2. **Deploy the function**
   ```bash
   supabase functions deploy inbox-ai-suggest-reply
   ```

3. **Set the same key in your local env** (e.g. `.env.local`)
   ```
   VITE_INTERNAL_FUNCTION_KEY=<same-secret>
   ```
   Restart the Vite dev server after changing this.

### Warning

- **Do not commit keys** to the repo. Add `.env.local` to `.gitignore` if needed.
- **Use only for localhost** until real auth exists. Once login is implemented, the codebase includes a TODO to remove the internal-key fallback and require JWT only.
