-- Split full_name into first_name/last_name so exports can have them as
-- separate columns.
--
-- Backward compatible on purpose: full_name stays a regular column, and a
-- BEFORE INSERT trigger fills in whichever side the caller didn't send
-- (old code sends only full_name; new code sends first_name/last_name).
-- That way the currently deployed site keeps working while this is
-- applied, before the new code is deployed.
--
-- Existing rows are split at the first space (best effort: compound first
-- names like "María José" will land as first_name = "María",
-- last_name = "José ..."). New signups use separate inputs.

alter table public.waiver_signatures add column if not exists first_name text;
alter table public.waiver_signatures add column if not exists last_name text;

update public.waiver_signatures
set
  first_name = coalesce(nullif(split_part(trim(full_name), ' ', 1), ''), ''),
  last_name = coalesce(
    nullif(trim(substring(trim(full_name) from length(split_part(trim(full_name), ' ', 1)) + 1)), ''),
    ''
  )
where first_name is null or last_name is null;

alter table public.waiver_signatures alter column first_name set not null;
alter table public.waiver_signatures alter column last_name set not null;

create or replace function public.sync_signature_names()
returns trigger
language plpgsql
as $$
begin
  if new.first_name is null then
    new.first_name := coalesce(nullif(split_part(trim(new.full_name), ' ', 1), ''), '');
    new.last_name := coalesce(
      nullif(trim(substring(trim(new.full_name) from length(split_part(trim(new.full_name), ' ', 1)) + 1)), ''),
      ''
    );
  end if;

  if new.full_name is null or trim(new.full_name) = '' then
    new.full_name := trim(coalesce(new.first_name, '') || ' ' || coalesce(new.last_name, ''));
  end if;

  return new;
end;
$$;

drop trigger if exists waiver_signatures_sync_names on public.waiver_signatures;
create trigger waiver_signatures_sync_names
  before insert on public.waiver_signatures
  for each row execute function public.sync_signature_names();
