import { Resend } from "resend";
import ParticipantConfirmationEmail from "@/lib/email/templates/participant-confirmation";
import InternalNotificationEmail from "@/lib/email/templates/internal-notification";

type EventInfo = {
  name: string;
  companyLine: string;
  eventDate: string;
};

// What the emails need to know about a signature. For guardian signatures
// the participant is the minor and the signer (who receives the
// confirmation) is the guardian.
export type ConfirmationSignature = {
  signerType: "adult" | "guardian";
  signerName: string;
  participantName: string;
  guardianRelationship: string | null;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  hasMedicalInfo: boolean | null;
  medicalInfo: string | null;
  acceptedLiability: boolean;
  acceptedImageUse: boolean;
  signedAt: string;
};

// Fire-and-forget: email delivery failures are logged but never block or
// undo the signature, which is already durably stored in Supabase.
export async function sendConfirmationEmails(
  signature: ConfirmationSignature,
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
        signerName: signature.signerName,
        participantName: signature.participantName,
        isGuardian: signature.signerType === "guardian",
        eventName: event.name,
        companyLine: event.companyLine,
        eventDate: event.eventDate,
      }),
    }),
    resend.emails.send({
      from,
      to: internalTo,
      subject: `Nueva firma de waiver — ${signature.participantName} — ${event.name}`,
      react: InternalNotificationEmail({
        eventName: event.name,
        companyLine: event.companyLine,
        signerType: signature.signerType,
        signerName: signature.signerName,
        participantName: signature.participantName,
        guardianRelationship: signature.guardianRelationship,
        email: signature.email,
        phone: signature.phone,
        emergencyContactName: signature.emergencyContactName,
        emergencyContactPhone: signature.emergencyContactPhone,
        hasMedicalInfo: signature.hasMedicalInfo,
        medicalInfo: signature.medicalInfo,
        acceptedLiability: signature.acceptedLiability,
        acceptedImageUse: signature.acceptedImageUse,
        signedAt: signature.signedAt,
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
