import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export type InvitationEmailProps = {
  workspaceName: string;
  inviterName: string;
  acceptUrl: string;
  expiresInDays: number;
};

export function InvitationEmail({
  workspaceName,
  inviterName,
  acceptUrl,
  expiresInDays,
}: InvitationEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>
        {inviterName} te invitó a {workspaceName} en costo
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading as="h1" style={heading}>
            costo
          </Heading>
          <Text style={text}>
            <strong>{inviterName}</strong> te invitó a colaborar en el workspace{' '}
            <strong>{workspaceName}</strong>.
          </Text>
          <Text style={text}>
            En costo van a poder cargar gastos juntos, ver totales combinados y trackear sus
            proyectos.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: 32, marginBottom: 32 }}>
            <Button href={acceptUrl} style={button}>
              Aceptar invitación
            </Button>
          </Section>
          <Text style={small}>
            Si el botón no funciona, copiá y pegá este link en tu browser:
          </Text>
          <Text style={smallLink}>{acceptUrl}</Text>
          <Hr style={hr} />
          <Text style={small}>
            La invitación expira en {expiresInDays} día{expiresInDays === 1 ? '' : 's'}. Si no
            la esperabas, ignorá este email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, sans-serif',
  margin: 0,
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: 12,
  margin: '0 auto',
  maxWidth: 480,
  padding: 32,
};

const heading = {
  color: '#0a0a0a',
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: '0 0 24px',
};

const text = {
  color: '#404040',
  fontSize: 15,
  lineHeight: '24px',
  margin: '0 0 16px',
};

const button = {
  backgroundColor: '#0a0a0a',
  borderRadius: 8,
  color: '#ffffff',
  display: 'inline-block',
  fontSize: 15,
  fontWeight: 500,
  padding: '12px 24px',
  textDecoration: 'none',
};

const small = {
  color: '#737373',
  fontSize: 13,
  lineHeight: '20px',
  margin: '0 0 8px',
};

const smallLink = {
  color: '#737373',
  fontSize: 12,
  lineHeight: '18px',
  margin: '0 0 16px',
  wordBreak: 'break-all' as const,
};

const hr = {
  borderColor: '#e5e5e5',
  borderStyle: 'solid',
  borderWidth: '1px 0 0',
  margin: '24px 0',
};
