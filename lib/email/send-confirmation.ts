import { Resend } from "resend";
import ParticipantConfirmationEmail from "@/lib/email/templates/participant-confirmation";
import InternalNotificationEmail from "@/lib/email/templates/internal-notification";
import type { WaiverSignature } from "@/types/domain";

type EventInfo = {
  name: string;
  companyLine: string;
  eventDate: string;
};

// Fire-and-forget: email delivery failures are logged but never block or
// undo the signature, which is already durably stored in Supabase.
export async function sendConfirmationEmails(
  signature: Pick<
    WaiverSignature,
    | "full_name"
    | "email"
    | "phone"
    | "emergency_contact_name"
    | "emergency_contact_phone"
    | "accepted_liability"
    | "accepted_image_use"
    | "signed_at"
  >,
  event: EventInfo,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const internalTo = process.env.EMAIL_INTERNAL_TO;

  if (!apiKey || !from || !internalTo) {
    console.error("Resend no configurado: falta RESEND_API_KEY, EMAIL_FROM o EMAIL_INTERNAL_TO");
    return;
  }

  const resend = new Resend(apiKey);

  // resend.emails.send() does NOT reject/throw on API-level failures (bad
  // from address, quota exceeded, etc.) — it resolves with { data: null,
  // error }. Promise.allSettled only catches network-level rejections, so
  // the resolved `.error` field has to be checked explicitly too, or real
  // send failures go completely unlogged.
  const [participantResult, internalResult] = await Promise.allSettled([
    resend.emails.send({
      from,
      to: signature.email,
      subject: `Firma registrada — ${event.name}`,
      react: ParticipantConfirmationEmail({
        fullName: signature.full_name,
        eventName: event.name,
        companyLine: event.companyLine,
        eventDate: event.eventDate,
      }),
    }),
    resend.emails.send({
      from,
      to: internalTo,
      subject: `Nueva firma de waiver — ${event.name}`,
      react: InternalNotificationEmail({
        eventName: event.name,
        companyLine: event.companyLine,
        fullName: signature.full_name,
        email: signature.email,
        phone: signature.phone,
        emergencyContactName: signature.emergency_contact_name,
        emergencyContactPhone: signature.emergency_contact_phone,
        acceptedLiability: signature.accepted_liability,
        acceptedImageUse: signature.accepted_image_use,
        signedAt: signature.signed_at,
      }),
    }),
  ]);

  if (participantResult.status === "rejected") {
    console.error("Error enviando email de confirmación al participante:", participantResult.reason);
  } else if (participantResult.value.error) {
    console.error("Resend rechazó el email de confirmación al participante:", participantResult.value.error);
  }

  if (internalResult.status === "rejected") {
    console.error("Error enviando email de notificación interna:", internalResult.reason);
  } else if (internalResult.value.error) {
    console.error("Resend rechazó el email de notificación interna:", internalResult.value.error);
  }
}
