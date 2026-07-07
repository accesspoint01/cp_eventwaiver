import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

type Props = {
  eventName: string;
  companyLine: string;
  fullName: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  signedAt: string;
};

export default function InternalNotificationEmail({
  eventName,
  companyLine,
  fullName,
  email,
  phone,
  emergencyContactName,
  emergencyContactPhone,
  signedAt,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Nueva firma de waiver: {fullName} — {eventName}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "8px" }}>
          <Heading as="h2">
            Nueva firma — {eventName}
            {companyLine}
          </Heading>
          <Section>
            <Text style={{ margin: 0 }}><strong>Nombre:</strong> {fullName}</Text>
            <Text style={{ margin: 0 }}><strong>Email:</strong> {email}</Text>
            <Text style={{ margin: 0 }}><strong>Teléfono:</strong> {phone}</Text>
            <Text style={{ margin: 0 }}>
              <strong>Contacto de emergencia:</strong> {emergencyContactName} ({emergencyContactPhone})
            </Text>
            <Text style={{ margin: 0 }}><strong>Firmado:</strong> {signedAt}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
