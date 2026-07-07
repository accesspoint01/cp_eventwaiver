-- Supports the v2 legal text: an optional per-event risk-specific clause
-- (for medium/high-risk activities) and a toggle for whether the section
-- requiring parent/guardian consent for minors should appear.
alter table public.events add column if not exists risk_clause text;
alter table public.events add column if not exists includes_minors boolean not null default false;

-- Recreate the public view to expose the two new columns to the waiver form.
create or replace view public.public_event_info
  with (security_invoker = true) as
select
  id,
  name,
  company_name,
  third_party_name,
  event_date,
  slug,
  is_active,
  waiver_version,
  risk_clause,
  includes_minors
from public.events
where is_active = true;
