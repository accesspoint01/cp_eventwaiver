-- team_name was redundant: the client/organization already appears in the
-- waiver legal text via events.company_name / third_party_name.
alter table public.waiver_signatures drop column if exists team_name;
