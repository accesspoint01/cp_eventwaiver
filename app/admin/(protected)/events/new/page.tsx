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

export default function NewEventPage() {
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
            required
            placeholder="Ej. Custom Scavenger Hunt Team Building @ Old San Juan"
            className={inputClass}
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">
            Compañía cliente (opcional)
          </label>
          <input
            name="company_name"
            placeholder="Ej. Piko Therapy"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">
            Facilitador externo (opcional)
          </label>
          <input name="third_party_name" className={inputClass} />
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
