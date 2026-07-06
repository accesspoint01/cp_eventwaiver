-- Center Point / Access Point PR LLC — liability waiver system
-- Full schema + RLS for events, waiver signatures, versioned legal text, and admin allowlist.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Table: events
-- ---------------------------------------------------------
create table public.events (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,                    -- e.g. "Custom Scavenger Hunt Team Building @ Old San Juan"
  company_name      text,                              -- client that hired the event, e.g. "Piko Therapy" (blank if Center Point runs it directly)
  third_party_name  text,                              -- optional additional co-facilitator company, independent of company_name
  event_date        date not null,
  slug              text not null unique,              -- admin-controlled, e.g. "pikotherapy" or "pikotherapy-julio2026"
  is_active         boolean not null default true,
  waiver_version    text not null default 'v1',
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index events_slug_idx on public.events (slug);
create index events_is_active_idx on public.events (is_active);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Table: waiver_signatures
-- ---------------------------------------------------------
create table public.waiver_signatures (
  id                      uuid primary key default gen_random_uuid(),
  event_id                uuid not null references public.events(id) on delete cascade,

  full_name               text not null,
  email                   text not null,
  phone                   text not null,
  team_name               text,

  emergency_contact_name  text not null,
  emergency_contact_phone text not null,

  accepted_terms          boolean not null,
  signature_name          text not null,               -- typed full name, serves as the e-signature
  waiver_version          text not null,                -- version of the legal text this person actually accepted

  signed_at               timestamptz not null default now(),
  ip_address              text,
  user_agent              text,

  created_at              timestamptz not null default now(),

  constraint accepted_terms_must_be_true check (accepted_terms = true),
  constraint email_format check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

create index waiver_signatures_event_id_idx on public.waiver_signatures (event_id);
create index waiver_signatures_signed_at_idx on public.waiver_signatures (signed_at);
create index waiver_signatures_email_idx on public.waiver_signatures (email);

-- ---------------------------------------------------------
-- Table: waiver_text_versions (versioned legal text)
-- ---------------------------------------------------------
create table public.waiver_text_versions (
  version       text primary key,
  body_template text not null,                          -- contains {{event_name}}, {{company_line}}, {{parties_clause}}, {{event_date}}
  is_current    boolean not null default false,
  created_at    timestamptz not null default now()
);

create unique index waiver_text_versions_only_one_current
  on public.waiver_text_versions (is_current)
  where is_current = true;

-- ---------------------------------------------------------
-- Table: admin_allowlist
-- ---------------------------------------------------------
create table public.admin_allowlist (
  email         text primary key,
  created_at    timestamptz not null default now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.events enable row level security;
alter table public.waiver_signatures enable row level security;
alter table public.waiver_text_versions enable row level security;
alter table public.admin_allowlist enable row level security;

-- ---------- events ----------

create policy "public can read active events"
  on public.events
  for select
  to anon
  using (is_active = true);

create policy "authenticated admins can manage events"
  on public.events
  for all
  to authenticated
  using (
    exists (
      select 1 from public.admin_allowlist a
      where lower(a.email) = lower(auth.jwt() ->> 'email')
    )
  )
  with check (
    exists (
      select 1 from public.admin_allowlist a
      where lower(a.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- ---------- waiver_signatures ----------

create policy "public can insert signature for active event"
  on public.waiver_signatures
  for insert
  to anon
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.is_active = true
    )
  );

create policy "authenticated admins can read signatures"
  on public.waiver_signatures
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_allowlist a
      where lower(a.email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "authenticated admins can delete signatures"
  on public.waiver_signatures
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.admin_allowlist a
      where lower(a.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- No UPDATE policy is granted to anyone: once signed, a record is immutable
-- from the client, preserving the integrity of the legal record.

-- ---------- waiver_text_versions ----------

create policy "public can read waiver text versions"
  on public.waiver_text_versions
  for select
  to anon
  using (true);

create policy "authenticated admins can manage waiver text versions"
  on public.waiver_text_versions
  for all
  to authenticated
  using (
    exists (
      select 1 from public.admin_allowlist a
      where lower(a.email) = lower(auth.jwt() ->> 'email')
    )
  )
  with check (
    exists (
      select 1 from public.admin_allowlist a
      where lower(a.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- ---------- admin_allowlist ----------
-- Writes are managed only via service_role (migrations/Supabase Studio) — no
-- insert/update/delete policy is granted here. A narrow select policy is
-- required, though: the exists(...) subqueries in the policies above (for
-- events/waiver_signatures/waiver_text_versions) run under the querying
-- user's role, and Postgres enforces RLS on admin_allowlist too when it's
-- referenced from those subqueries. Without any select policy, the subquery
-- would always see zero rows and every admin check above would silently
-- fail closed. Restricting visibility to "your own row" is enough to make
-- those exists() checks work without exposing the full staff list.
create policy "authenticated can check their own allowlist row"
  on public.admin_allowlist
  for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- =========================================================
-- Public view: reduced event info for the waiver form
-- =========================================================
create view public.public_event_info
  with (security_invoker = true) as
select
  id,
  name,
  company_name,
  third_party_name,
  event_date,
  slug,
  is_active,
  waiver_version
from public.events
where is_active = true;

-- =========================================================
-- Seed: initial admin + placeholder waiver text (v1)
-- =========================================================
insert into public.admin_allowlist (email) values
  ('kerenacevedo@accesspointpr.com');

insert into public.waiver_text_versions (version, body_template, is_current) values (
  'v1',
  E'RELEVO DE RESPONSABILIDAD Y AUTORIZACION DE USO DE IMAGEN\n' ||
  E'Evento: {{event_name}}{{company_line}}\n' ||
  E'Fecha: {{event_date}}\n\n' ||
  E'Yo, la persona que firma abajo, reconozco que mi participacion (o la de mi equipo) en el evento antes mencionado, organizado por Center Point (nombre comercial operado por Access Point PR LLC){{parties_clause}}, es completamente voluntaria.\n\n' ||
  E'1. Relevo de responsabilidad: Entiendo y acepto que Access Point PR LLC (operando como Center Point){{parties_clause}}, y sus organizadores, empleados, contratistas y representantes no seran responsables por lesiones, danos, perdidas o cualquier otro perjuicio que yo o mi equipo podamos sufrir antes, durante o despues del evento, salvo que sea producto de negligencia grave o dolo comprobado de dichas partes.\n\n' ||
  E'2. Autorizacion de fotos y video: Autorizo a Access Point PR LLC (Center Point){{parties_clause}} a tomar fotografias y/o video durante el evento en los que yo (o mi equipo) pueda aparecer, y a usar, reproducir y publicar dicho material con fines promocionales, informativos o de mercadeo, en cualquier medio (redes sociales, sitio web, prensa, etc.), sin compensacion alguna a mi favor.\n\n' ||
  E'3. Declaracion: Declaro que he leido este documento en su totalidad, que lo entiendo, y que lo firmo de forma libre y voluntaria.',
  true
);
