"use client";

import { useActionState, useState } from "react";
import ReactMarkdown from "react-markdown";
import { submitSignature, type SubmitState } from "./actions";

const markdownComponents = {
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-4 text-base font-semibold text-zinc-900 first:mt-0" {...props} />
  ),
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-4 text-sm font-semibold text-zinc-900 first:mt-0" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => (
    <p className="mt-2 first:mt-0" {...props} />
  ),
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-zinc-900" {...props} />
  ),
  hr: () => <hr className="my-4 border-zinc-200" />,
};

const initialState: SubmitState = { ok: false };

const inputClass =
  "h-12 w-full rounded-md border border-zinc-300 px-3 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none";
const labelClass = "text-sm font-medium text-zinc-700";

function SignatureForm({
  eventId,
  waiverVersion,
  onSignAnother,
}: {
  eventId: string;
  waiverVersion: string;
  onSignAnother: () => void;
}) {
  const [state, formAction, isPending] = useActionState(submitSignature, initialState);

  if (state.ok) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-semibold text-green-800">
          Firma registrada correctamente
        </p>
        <p className="mt-2 text-sm text-green-700">
          Te enviamos un correo de confirmación. ¡Gracias!
        </p>
        <button
          type="button"
          onClick={onSignAnother}
          className="mt-4 h-11 w-full rounded-md bg-white border border-green-300 text-green-800 font-medium"
        >
          Firmar otra persona
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="waiver_version" value={waiverVersion} />

      <div>
        <label className={labelClass} htmlFor="full_name">Nombre completo</label>
        <input
          id="full_name"
          name="full_name"
          autoComplete="name"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="phone">Teléfono</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="emergency_contact_name">
            Contacto de emergencia
          </label>
          <input
            id="emergency_contact_name"
            name="emergency_contact_name"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emergency_contact_phone">
            Tel. de emergencia
          </label>
          <input
            id="emergency_contact_phone"
            name="emergency_contact_phone"
            type="tel"
            inputMode="tel"
            required
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="accepted_terms" required className="mt-1 h-4 w-4" />
        He leído y acepto los términos del relevo de responsabilidad y la
        autorización de uso de imagen.
      </label>

      <div>
        <label className={labelClass} htmlFor="signature_name">
          Firma (escribe tu nombre completo)
        </label>
        <input
          id="signature_name"
          name="signature_name"
          required
          className={inputClass}
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-md bg-zinc-900 font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Enviando..." : "Firmar y enviar"}
      </button>
    </form>
  );
}

export default function WaiverForm({
  eventId,
  eventName,
  waiverVersion,
  waiverText,
}: {
  eventId: string;
  eventName: string;
  waiverVersion: string;
  waiverText: string;
}) {
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-zinc-900">Waiver: {eventName}</h1>
      </header>

      <div className="max-h-[32rem] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 sm:max-h-[40rem]">
        <ReactMarkdown components={markdownComponents}>{waiverText}</ReactMarkdown>
      </div>

      <SignatureForm
        key={instanceKey}
        eventId={eventId}
        waiverVersion={waiverVersion}
        onSignAnother={() => setInstanceKey((k) => k + 1)}
      />
    </div>
  );
}
