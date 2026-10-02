-- Minors support: per-event audience, a separate guardian legal text, and
-- guardian/medical fields on signatures.
--
-- Backward compatible with the currently deployed code: includes_minors
-- stays (unused by new code, can be dropped in a later cleanup), the view
-- only gains columns at the end, guardian texts are NOT marked
-- is_current (the old code does .eq('is_current', true).maybeSingle() and
-- would break/fall back to v1 if two rows matched).

-- events.audience: who signs this event's waiver.
alter table public.events add column if not exists audience text not null default 'adults';
alter table public.events
  add constraint events_audience_check check (audience in ('adults', 'minors'));
alter table public.events add column if not exists guardian_waiver_version text;

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
  includes_minors,
  guardian_waiver_version,
  audience
from public.events
where is_active = true;

-- waiver_text_versions.kind: 'adult' texts use is_current as before; the
-- guardian text in use is the most recently created kind = 'guardian' row.
alter table public.waiver_text_versions add column if not exists kind text not null default 'adult';
alter table public.waiver_text_versions
  add constraint waiver_text_versions_kind_check check (kind in ('adult', 'guardian'));

-- waiver_signatures: for guardian signatures, first_name/last_name are the
-- minor participant; guardian_* is the adult who signed.
alter table public.waiver_signatures add column if not exists signer_type text not null default 'adult';
alter table public.waiver_signatures add column if not exists guardian_first_name text;
alter table public.waiver_signatures add column if not exists guardian_last_name text;
alter table public.waiver_signatures add column if not exists guardian_relationship text;
alter table public.waiver_signatures add column if not exists has_medical_info boolean;
alter table public.waiver_signatures add column if not exists medical_info text;

alter table public.waiver_signatures
  add constraint waiver_signatures_signer_type_check check (signer_type in ('adult', 'guardian'));

alter table public.waiver_signatures
  add constraint waiver_signatures_guardian_fields_check check (
    signer_type <> 'guardian' or (
      guardian_first_name is not null
      and guardian_last_name is not null
      and guardian_relationship is not null
      and has_medical_info is not null
    )
  );

alter table public.waiver_signatures
  add constraint waiver_signatures_medical_info_check check (
    not coalesce(has_medical_info, false)
    or (medical_info is not null and length(trim(medical_info)) > 0)
  );
