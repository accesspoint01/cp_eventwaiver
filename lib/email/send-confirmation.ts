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
    | "team_name"
    | "emergency_contact_name"
    | "emergency_contact_phone"
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
        teamName: signature.team_name,
        emergencyContactName: signature.emergency_contact_name,
        emergencyContactPhone: signature.emergency_contact_phone,
        signedAt: signature.signed_at,
      }),
    }),
  ]);

  if (participantResult.status === "rejected") {
    console.error("Error enviando email de confirmación al participante:", participantResult.reason);
  }
  if (internalResult.status === "rejected") {
    console.error("Error enviando email de notificación interna:", internalResult.reason);
  }
}
