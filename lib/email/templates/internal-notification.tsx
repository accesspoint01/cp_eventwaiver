import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

type Props = {
  eventName: string;
  companyLine: string;
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

const relationshipLabel: Record<string, string> = {
  padre: "padre",
  madre: "madre",
  tutor: "tutor legal",
};

export default function InternalNotificationEmail({
  eventName,
  companyLine,
  signerType,
  signerName,
  participantName,
  guardianRelationship,
  email,
  phone,
  emergencyContactName,
  emergencyContactPhone,
  hasMedicalInfo,
  medicalInfo,
  acceptedLiability,
  acceptedImageUse,
  signedAt,
}: Props) {
  const isGuardian = signerType === "guardian";

  return (
    <Html>
      <Head />
      <Preview>Nueva firma de waiver: {participantName} — {eventName}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "8px" }}>
          <Heading as="h2">
            Nueva firma — {eventName}
            {companyLine}
          </Heading>
          <Section>
            <Text style={{ margin: 0 }}>
              <strong>{isGuardian ? "Participante (menor):" : "Nombre:"}</strong> {participantName}
            </Text>
            {isGuardian && (
              <Text style={{ margin: 0 }}>
                <strong>Firmó:</strong> {signerName} (
                {relationshipLabel[guardianRelationship ?? ""] ?? guardianRelationship})
              </Text>
            )}
            <Text style={{ margin: 0 }}><strong>Email:</strong> {email}</Text>
            <Text style={{ margin: 0 }}><strong>Teléfono:</strong> {phone}</Text>
            <Text style={{ margin: 0 }}>
              <strong>Contacto de emergencia:</strong> {emergencyContactName} ({emergencyContactPhone})
            </Text>
            {isGuardian && (
              <Text style={{ margin: 0 }}>
                <strong>Alergias o medicamentos:</strong>{" "}
                {hasMedicalInfo ? `Sí — ${medicalInfo}` : "No"}
              </Text>
            )}
            <Text style={{ margin: 0 }}>
              <strong>Responsabilidad:</strong> {acceptedLiability ? "Sí" : "No"}
            </Text>
            <Text style={{ margin: 0 }}>
              <strong>Imagen:</strong> {acceptedImageUse ? "Sí" : "No"}
            </Text>
            <Text style={{ margin: 0 }}><strong>Firmado:</strong> {signedAt}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
