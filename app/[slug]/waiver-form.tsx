"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
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
const sectionTitleClass = "text-sm font-semibold text-zinc-900";
const textBoxClass =
  "max-h-80 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 sm:max-h-96";

type SignerType = "adult" | "guardian";

// Guardian details that carry over when the same parent signs for another
// child. Consent checkboxes, the signature and everything about the child
// are deliberately NOT carried over: each submission must be explicit.
type GuardianCarryOver = {
  guardian_first_name: string;
  guardian_last_name: string;
  guardian_relationship: string;
  email: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

const CARRY_OVER_FIELDS: (keyof GuardianCarryOver)[] = [
  "guardian_first_name",
  "guardian_last_name",
  "guardian_relationship",
  "email",
  "phone",
  "emergency_contact_name",
  "emergency_contact_phone",
];

function SignatureForm({
  eventId,
  signerType,
  liabilityText,
  imageText,
  carryOver,
  onSignAnother,
}: {
  eventId: string;
  signerType: SignerType;
  liabilityText: string;
  imageText: string;
  carryOver: Partial<GuardianCarryOver>;
  onSignAnother: (carry: Partial<GuardianCarryOver>) => void;
}) {
  const [state, formAction, isPending] = useActionState(submitSignature, initialState);
  const [hasMedical, setHasMedical] = useState<"yes" | "no" | null>(null);
  const [lastCarry, setLastCarry] = useState<Partial<GuardianCarryOver>>({});
  const isGuardian = signerType === "guardian";

  function handleAction(formData: FormData) {
    if (isGuardian) {
      const carry: Partial<GuardianCarryOver> = {};
      for (const field of CARRY_OVER_FIELDS) {
        carry[field] = String(formData.get(field) ?? "");
      }
      setLastCarry(carry);
    }
    formAction(formData);
  }

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
          onClick={() => onSignAnother(lastCarry)}
          className="mt-4 h-11 w-full rounded-md bg-white border border-green-300 text-green-800 font-medium"
        >
          {isGuardian ? "Firmar por otro participante" : "Firmar otra persona"}
        </button>
      </div>
    );
  }

  return (
    <form action={handleAction} className="space-y-4">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="signer_type" value={signerType} />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">
          Relevo de responsabilidad
        </h2>
        <div className={textBoxClass}>
          <ReactMarkdown components={markdownComponents}>{liabilityText}</ReactMarkdown>
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="accepted_liability"
            required
            className="mt-1 h-4 w-4"
          />
          {isGuardian
            ? "Como padre, madre o tutor legal, he leído y acepto los términos del relevo de responsabilidad, en mi propio nombre y en representación del menor."
            : "He leído y acepto los términos del relevo de responsabilidad."}
        </label>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">
          Autorización de uso de imagen
        </h2>
        <div className={textBoxClass}>
          <ReactMarkdown components={markdownComponents}>{imageText}</ReactMarkdown>
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="accepted_image_use" className="mt-1 h-4 w-4" />
          {isGuardian
            ? "Autorizo el uso de fotos/video del menor como se describe arriba. (El menor puede participar sin esta autorización.)"
            : "Autorizo el uso de mis fotos/video como se describe arriba. (Puedes participar sin marcar esto.)"}
        </label>
      </div>

      {isGuardian ? (
        <>
          <fieldset className="space-y-3">
            <legend className={sectionTitleClass}>Participante (menor de edad)</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="first_name">Nombre(s) del menor</label>
                <input id="first_name" name="first_name" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="last_name">Apellido(s) del menor</label>
                <input id="last_name" name="last_name" required className={inputClass} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={sectionTitleClass}>Padre, madre o tutor legal (quien firma)</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="guardian_first_name">Nombre(s)</label>
                <input
                  id="guardian_first_name"
                  name="guardian_first_name"
                  autoComplete="given-name"
                  required
                  defaultValue={carryOver.guardian_first_name}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="guardian_last_name">Apellido(s)</label>
                <input
                  id="guardian_last_name"
                  name="guardian_last_name"
                  autoComplete="family-name"
                  required
                  defaultValue={carryOver.guardian_last_name}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="guardian_relationship">
                Relación con el menor
              </label>
              <select
                id="guardian_relationship"
                name="guardian_relationship"
                required
                defaultValue={carryOver.guardian_relationship ?? ""}
                className={inputClass}
              >
                <option value="" disabled>Selecciona...</option>
                <option value="padre">Padre</option>
                <option value="madre">Madre</option>
                <option value="tutor">Tutor(a) legal</option>
              </select>
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
                defaultValue={carryOver.email}
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
                defaultValue={carryOver.phone}
                className={inputClass}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={sectionTitleClass}>Contacto de emergencia del menor</legend>
            <p className="text-xs text-zinc-500">
              Una persona a quien podamos llamar durante la actividad. Puede ser usted.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="emergency_contact_name">Nombre</label>
                <input
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  required
                  defaultValue={carryOver.emergency_contact_name}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="emergency_contact_phone">Teléfono</label>
                <input
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  type="tel"
                  inputMode="tel"
                  required
                  defaultValue={carryOver.emergency_contact_phone}
                  className={inputClass}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={sectionTitleClass}>
              ¿El menor tiene alergias, condiciones médicas o toma medicamentos?
            </legend>
            <div className="flex gap-6 text-sm text-zinc-700">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="has_medical_info"
                  value="no"
                  required
                  onChange={() => setHasMedical("no")}
                  className="h-4 w-4"
                />
                No
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="has_medical_info"
                  value="yes"
                  onChange={() => setHasMedical("yes")}
                  className="h-4 w-4"
                />
                Sí
              </label>
            </div>
            {hasMedical === "yes" && (
              <div>
                <label className={labelClass} htmlFor="medical_info">
                  Describe las alergias, condiciones y/o medicamentos (incluye dosis si aplica)
                </label>
                <textarea
                  id="medical_info"
                  name="medical_info"
                  required
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            )}
          </fieldset>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="first_name">Nombre(s)</label>
              <input
                id="first_name"
                name="first_name"
                autoComplete="given-name"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="last_name">Apellido(s)</label>
              <input
                id="last_name"
                name="last_name"
                autoComplete="family-name"
                required
                className={inputClass}
              />
            </div>
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
        </>
      )}

      <div>
        <label className={labelClass} htmlFor="signature_name">
          {isGuardian
            ? "Firma del padre, madre o tutor (escribe tu nombre completo)"
            : "Firma (escribe tu nombre completo)"}
        </label>
        <input
          id="signature_name"
          name="signature_name"
          required
          className={inputClass}
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="reviewed_confirmation"
          required
          className="mt-1 h-4 w-4"
        />
        {isGuardian
          ? "Confirmo que revisé toda la información anterior (relevo de responsabilidad y autorización de uso de imagen) y que los datos que proveí sobre el menor son correctos."
          : "Confirmo que revisé toda la información anterior (relevo de responsabilidad y autorización de uso de imagen) antes de firmar."}
      </label>

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
  signerType,
  liabilityText,
  imageText,
}: {
  eventId: string;
  eventName: string;
  signerType: SignerType;
  liabilityText: string;
  imageText: string;
}) {
  const [instanceKey, setInstanceKey] = useState(0);
  const [carryOver, setCarryOver] = useState<Partial<GuardianCarryOver>>({});

  return (
    <div className="space-y-6">
      <header>
        <Image
          src="/cp-logo.png"
          alt="Center Point"
          width={105}
          height={59}
          className="mb-3"
          priority
        />
        <h1 className="text-xl font-semibold text-zinc-900">Waiver: {eventName}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {signerType === "guardian"
            ? "Formulario de relevo de responsabilidad y autorización de uso de imagen para padres, madres o tutores legales de participantes menores de edad"
            : "Formulario de relevo de responsabilidad y autorización de uso de imagen"}
        </p>
      </header>

      <SignatureForm
        key={instanceKey}
        eventId={eventId}
        signerType={signerType}
        liabilityText={liabilityText}
        imageText={imageText}
        carryOver={carryOver}
        onSignAnother={(carry) => {
          setCarryOver(carry);
          setInstanceKey((k) => k + 1);
        }}
      />
    </div>
  );
}
