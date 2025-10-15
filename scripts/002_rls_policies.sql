alter table public.documents enable row level security;
alter table public.signatures enable row level security;

-- Assume 'auth.uid()' is available via Supabase
drop policy if exists "documents owners can read" on public.documents;
create policy "documents owners can read" on public.documents
for select using (user_id = auth.uid());

drop policy if exists "documents owners can insert" on public.documents;
create policy "documents owners can insert" on public.documents
for insert with check (user_id = auth.uid());

drop policy if exists "documents owners can delete" on public.documents;
create policy "documents owners can delete" on public.documents
for delete using (user_id = auth.uid());

drop policy if exists "signatures owners can read" on public.signatures;
create policy "signatures owners can read" on public.signatures
for select using (user_id = auth.uid());

drop policy if exists "signatures owners can insert" on public.signatures;
create policy "signatures owners can insert" on public.signatures
for insert with check (user_id = auth.uid());

drop policy if exists "signatures owners can delete" on public.signatures;
create policy "signatures owners can delete" on public.signatures
for delete using (user_id = auth.uid());
