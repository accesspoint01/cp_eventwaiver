-- The original insert policy only covered the "anon" role. A logged-in
-- admin testing the public waiver form in the same browser session (or an
-- admin filling it out on someone's behalf) authenticates as "authenticated"
-- instead, and had no matching insert policy, so RLS rejected the row.
-- Broadening this to "public" covers both anon and authenticated the same
-- way, with the same active-event condition.
drop policy if exists "public can insert signature for active event" on public.waiver_signatures;

create policy "anyone can insert signature for active event"
  on public.waiver_signatures
  for insert
  to public
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.is_active = true
    )
  );
