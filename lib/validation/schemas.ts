import { z } from "zod";

export const signatureSchema = z.object({
  event_id: z.string().uuid(),
  full_name: z.string().trim().min(2, "Escribe tu nombre completo"),
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
  waiver_version: z.string().min(1),
});

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
  includes_minors: z.boolean().optional(),
});

export type EventInput = z.infer<typeof eventSchema>;

export const adminSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre"),
  email: z.string().trim().toLowerCase().email("Escribe un email válido"),
});

export type AdminInput = z.infer<typeof adminSchema>;
