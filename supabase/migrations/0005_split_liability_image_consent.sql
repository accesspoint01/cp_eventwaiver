-- Split the single "accepted_terms" checkbox into two independent
-- consents (liability release vs. photo/image authorization), plus a
-- final review confirmation checkbox required before submit.
alter table public.waiver_signatures drop constraint if exists accepted_terms_must_be_true;

alter table public.waiver_signatures rename column accepted_terms to accepted_liability;
alter table public.waiver_signatures add column if not exists accepted_image_use boolean not null default false;
alter table public.waiver_signatures add column if not exists reviewed_confirmation boolean not null default false;

alter table public.waiver_signatures add constraint accepted_liability_must_be_true check (accepted_liability = true);
alter table public.waiver_signatures add constraint reviewed_confirmation_must_be_true check (reviewed_confirmation = true);
