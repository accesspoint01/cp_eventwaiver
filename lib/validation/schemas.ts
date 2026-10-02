import { z } from "zod";

// Fields every signer fills in, adult or guardian. waiver_version is NOT
// here on purpose: the server derives it from the event so what gets
// stored always matches the text that was actually shown.
const signatureBase = z.object({
  event_id: z.string().uuid(),
  email: z.string().trim().email("Escribe un email válido"),
  phone: z.string().trim().min(7, "Escribe un teléfono válido"),
  emergency_contact_name: z.string().trim().min(2, "Escribe un contacto de emergencia"),
  emergency_contact_phone: z.string().trim().min(7, "Escribe un teléfono de emergencia válido"),
  accepted_liability: z.literal(true, {
    message: "Debes aceptar el relevo de responsabilidad para continuar",
  }),
  accepted_image_use: z.boolean(),
  signature_name: z.string().trim().min(2, "Escribe tu nombre como firma"),
  reviewed_confirmation: z.literal(true, {
    message: "Debes confirmar que revisaste toda la información",
  }),
});

const adultSignatureSchema = signatureBase.extend({
  signer_type: z.literal("adult"),
  first_name: z.string().trim().min(1, "Escribe tu nombre"),
  last_name: z.string().trim().min(1, "Escribe tu apellido"),
});

// For guardian signatures first_name/last_name are the MINOR participant;
// the guardian_* fields are the adult who signs.
const guardianSignatureSchema = signatureBase
  .extend({
    signer_type: z.literal("guardian"),
    first_name: z.string().trim().min(1, "Escribe el nombre del menor"),
    last_name: z.string().trim().min(1, "Escribe el apellido del menor"),
    guardian_first_name: z.string().trim().min(1, "Escribe tu nombre"),
    guardian_last_name: z.string().trim().min(1, "Escribe tu apellido"),
    guardian_relationship: z.enum(["padre", "madre", "tutor"], {
      message: "Indica tu relación con el menor",
    }),
    has_medical_info: z.boolean({
      message: "Indica si el menor tiene alergias o toma medicamentos",
    }),
    medical_info: z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
  })
  .refine((d) => !d.has_medical_info || (d.medical_info ?? "").length > 0, {
    message: "Describe las alergias, condiciones o medicamentos del menor",
    path: ["medical_info"],
  });

export const signatureSchema = z.discriminatedUnion("signer_type", [
  adultSignatureSchema,
  guardianSignatureSchema,
]);

export type SignatureInput = z.infer<typeof signatureSchema>;

// The waiver slug lives at the site root (waiver.centerpointpr.com/<slug>),
// so it can't collide with the app's own top-level routes.
const RESERVED_SLUGS = new Set(["admin", "auth"]);

export const eventSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del evento"),
  company_name: z.string().trim().max(200).optional().or(z.literal("")),
  third_party_name: z.string().trim().max(200).optional().or(z.literal("")),
  event_date: z.string().min(1, "Escoge una fecha"),
  slug: z
    .string()
    .trim()
    .min(2, "El link debe tener al menos 2 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones")
    .refine((slug) => !RESERVED_SLUGS.has(slug), {
      message: "Ese link está reservado, escoge otro",
    }),
  risk_clause: z.string().trim().max(2000).optional().or(z.literal("")),
  audience: z.enum(["adults", "minors"], { message: "Escoge el tipo de participantes" }),
});

export type EventInput = z.infer<typeof eventSchema>;

export const adminSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre"),
  email: z.string().trim().toLowerCase().email("Escribe un email válido"),
});

export type AdminInput = z.infer<typeof adminSchema>;
