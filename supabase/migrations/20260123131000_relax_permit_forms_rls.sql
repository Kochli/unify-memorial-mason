-- Relax RLS on permit_forms to match internal app behavior (orders, workers, etc.)
-- Allow both anon and authenticated roles full CRUD via a single allow-all policy.

-- Drop previous authenticated-only policies if they exist
drop policy if exists "Authenticated users can view permit forms" on public.permit_forms;
drop policy if exists "Authenticated users can create permit forms" on public.permit_forms;
drop policy if exists "Authenticated users can update permit forms" on public.permit_forms;
drop policy if exists "Authenticated users can delete permit forms" on public.permit_forms;

-- New allow-all policy (same style as orders, workers, inscriptions, etc.)
create policy "Allow all access to permit_forms" 
  on public.permit_forms
  for all
  using (true)
  with check (true);

