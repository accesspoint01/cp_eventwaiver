import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

type Props = {
  signerName: string;
  participantName: string;
  isGuardian: boolean;
  eventName: string;
  companyLine: string;
  eventDate: string;
};

export default function ParticipantConfirmationEmail({
  signerName,
  participantName,
  isGuardian,
  eventName,
  companyLine,
  eventDate,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        {isGuardian
          ? `La firma para ${participantName} quedó registrada`
          : `Tu firma para ${eventName} quedó registrada`}
      </Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "8px" }}>
          <Heading as="h2">¡Firma registrada, {signerName}!</Heading>
          <Text>
            {isGuardian
              ? `Gracias por firmar, como padre, madre o tutor legal de ${participantName}, el relevo de responsabilidad y la autorización de uso de imagen para:`
              : "Gracias por firmar el relevo de responsabilidad y la autorización de uso de imagen para:"}
          </Text>
          <Section style={{ backgroundColor: "#f4f4f5", padding: "12px 16px", borderRadius: "6px" }}>
            <Text style={{ margin: 0, fontWeight: 600 }}>
              {eventName}
              {companyLine}
            </Text>
            <Text style={{ margin: 0 }}>Fecha: {eventDate}</Text>
          </Section>
          <Text>
            Este correo confirma que la firma quedó guardada correctamente. Si
            tienes alguna pregunta, puedes responder a este correo.
          </Text>
          <Text style={{ color: "#71717a", fontSize: "12px" }}>
            Center Point — operado por Access Point PR LLC
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
