# Center Point — Waiver de eventos

App para recopilar el relevo de responsabilidad y la autorización de uso de
imagen de los participantes de eventos en Center Point (operado por Access
Point PR LLC), con panel de administración para crear eventos y ver/exportar
firmas.

## Setup local

1. `npm install`
2. Copia `.env.example` a `.env.local` y llena las variables:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — del proyecto Supabase existente.
   - `RESEND_API_KEY` — API key de Resend.
   - `EMAIL_FROM` / `EMAIL_INTERNAL_TO` — ya configurados a `myevent@centerpointpr.com` / `connect@centerpointpr.com`.
3. Aplica la migración `supabase/migrations/0001_init.sql` en el proyecto Supabase (SQL Editor o `supabase db push`). Esto crea las tablas, políticas RLS, y siembra un admin inicial (`kerenacevedo@accesspointpr.com`) más el texto legal `v1` (placeholder — pendiente de revisión legal).
4. `npm run dev` y abre `http://localhost:3000`.

## Despliegue (Netlify)

- Conectar el repo en Netlify; el `netlify.toml` ya incluye `@netlify/plugin-nextjs`.
- Configurar en Netlify (Site settings → Environment variables) las mismas variables de `.env.example`, con `NEXT_PUBLIC_SITE_URL` apuntando al dominio real (ej. `https://waiver.centerpointpr.com`).
- Verificar que el dominio `centerpointpr.com` esté verificado en Resend para poder enviar desde `myevent@centerpointpr.com` sin caer en spam.

## Agregar/quitar administradores

Por ahora se gestiona directamente en la tabla `admin_allowlist` desde Supabase Studio (no hay UI para esto todavía).

## Texto legal

El texto vigente vive en la tabla `waiver_text_versions` (versión `v1`, sembrada como placeholder). **Debe revisarlo un abogado antes de usarse en producción.** Para publicar una nueva versión: insertar una fila nueva con otra `version` y `is_current = true` (esto desmarca automáticamente la anterior); los eventos existentes conservan la versión que tenían salvo que se actualicen manualmente.
