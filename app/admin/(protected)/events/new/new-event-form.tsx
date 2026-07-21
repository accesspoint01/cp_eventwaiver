"use client";

import { useActionState, useState } from "react";
import { createEvent, type CreateEventState } from "./actions";

const initialState: CreateEventState = { ok: false };
const inputClass = "h-11 w-full rounded-md border border-zinc-300 px-3 text-base";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewEventForm({
  eventNames,
  companyNames,
  thirdPartyNames,
}: {
  eventNames: string[];
  companyNames: string[];
  thirdPartyNames: string[];
}) {
  const [state, formAction, isPending] = useActionState(createEvent, initialState);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-xl font-semibold text-zinc-900">Nuevo evento</h1>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-700">Nombre del evento</label>
          <input
            name="name"
            list="event-name-options"
            required
            autoComplete="off"
            placeholder="Ej. Custom Scavenger Hunt Team Building @ Old San Juan"
            className={inputClass}
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
          <datalist id="event-name-options">
            {eventNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">
            Compañía cliente (opcional)
          </label>
          <input
            name="company_name"
            list="company-name-options"
            autoComplete="off"
            placeholder="Ej. Piko Therapy"
            className={inputClass}
          />
          <datalist id="company-name-options">
            {companyNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">
            Facilitador externo (opcional)
          </label>
          <input
            name="third_party_name"
            list="third-party-name-options"
            autoComplete="off"
            className={inputClass}
          />
          <datalist id="third-party-name-options">
            {thirdPartyNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">Fecha del evento</label>
          <input type="date" name="event_date" required className={inputClass} />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">Link (slug)</label>
          <p className="mb-1 text-xs text-zinc-500">waiver.centerpointpr.com/{slug || "..."}</p>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className={`${inputClass} font-mono text-sm`}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">
            Cláusula de riesgo específico (opcional)
          </label>
          <p className="mb-1 text-xs text-zinc-500">
            Solo para actividades de riesgo medio/alto (agua, alturas, retos físicos intensos,
            equipo especializado). Se agrega dentro de la sección de asunción de riesgo del
            waiver. Déjalo en blanco para actividades de bajo riesgo.
          </p>
          <textarea
            name="risk_clause"
            rows={3}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="includes_minors" className="mt-1 h-4 w-4" />
          Este evento incluye participantes menores de 18 años (agrega la sección de
          consentimiento de padre/madre/tutor).
        </label>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="h-11 w-full rounded-md bg-zinc-900 font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Creando..." : "Crear evento"}
        </button>
      </form>
    </main>
  );
}
