"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createEvent, type CreateEventState } from "./new/actions";
import { updateEvent } from "./[id]/actions";
import type { Event } from "@/types/domain";

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

export default function EventForm({
  eventNames,
  companyNames,
  thirdPartyNames,
  event,
  signatureCount = 0,
}: {
  eventNames: string[];
  companyNames: string[];
  thirdPartyNames: string[];
  /** When present the form edits this event instead of creating a new one. */
  event?: Event;
  signatureCount?: number;
}) {
  const isEdit = !!event;
  const [state, formAction, isPending] = useActionState(
    event ? updateEvent.bind(null, event.id) : createEvent,
    initialState,
  );
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  // Changing the audience after people signed would mix signer types in one event.
  const audienceLocked = isEdit && signatureCount > 0;

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-xl font-semibold text-zinc-900">
        {isEdit ? "Editar evento" : "Nuevo evento"}
      </h1>
      {isEdit && signatureCount > 0 && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Este evento ya tiene {signatureCount} {signatureCount === 1 ? "firma" : "firmas"}.
          Las personas que ya firmaron vieron el texto con los datos anteriores; los cambios
          aplican solo a quienes firmen de ahora en adelante.
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-700">Nombre del evento</label>
          <input
            name="name"
            list="event-name-options"
            defaultValue={event?.name}
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
            defaultValue={event?.company_name ?? ""}
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
            defaultValue={event?.third_party_name ?? ""}
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
          <input
            type="date"
            name="event_date"
            defaultValue={event?.event_date}
            required
            className={inputClass}
          />
        </div>

        <fieldset className="space-y-2 rounded-md border border-zinc-200 bg-white p-3">
          <legend className="px-1 text-sm font-medium text-zinc-700">Participantes</legend>
          <label className="flex items-start gap-2 text-sm text-zinc-700">
            <input
              type="radio"
              name="audience"
              value="adults"
              defaultChecked={!event || event.audience === "adults"}
              disabled={audienceLocked}
              className="mt-1 h-4 w-4"
            />
            <span>
              <strong className="font-medium">Adultos</strong> — cada persona firma por sí misma.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-zinc-700">
            <input
              type="radio"
              name="audience"
              value="minors"
              defaultChecked={event?.audience === "minors"}
              disabled={audienceLocked}
              className="mt-1 h-4 w-4"
            />
            <span>
              <strong className="font-medium">Menores de edad</strong> — el padre, madre o tutor
              legal firma por cada menor (datos del menor y del tutor, contacto de emergencia
              y alergias/medicamentos).
            </span>
          </label>
          {audienceLocked && (
            <>
              <input type="hidden" name="audience" value={event?.audience} />
              <p className="text-xs text-zinc-500">
                No se puede cambiar el tipo de participantes porque el evento ya tiene firmas.
              </p>
            </>
          )}
        </fieldset>

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
          {isEdit && slug !== event?.slug && (
            <p className="mt-1 text-xs text-amber-700">
              Al cambiar el link, el anterior y los códigos QR ya impresos o compartidos dejan de
              funcionar.
            </p>
          )}
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
            defaultValue={event?.risk_clause ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base"
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
          {isPending
            ? isEdit ? "Guardando..." : "Creando..."
            : isEdit ? "Guardar cambios" : "Crear evento"}
        </button>
        {isEdit && (
          <Link
            href={`/admin/events/${event.id}`}
            className="block text-center text-sm text-zinc-500 hover:text-zinc-900"
          >
            Cancelar
          </Link>
        )}
      </form>
    </main>
  );
}
