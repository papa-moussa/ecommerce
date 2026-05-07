import { Body, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components';

interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const BaseLayout = ({ preview, children }: BaseLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Maison Parfum</Text>
          </Section>
          {children}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Maison Parfum · Une sélection rigoureuse de parfums de niche
            </Text>
            <Text style={footerLink}>
              <a href="http://localhost:3002/unsubscribe" style={link}>
                Se désinscrire
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f5f0e8',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
};

const header = {
  padding: '32px',
  textAlign: 'center' as const,
};

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  padding: '32px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#999',
  fontSize: '12px',
  lineHeight: '16px',
};

const footerLink = {
  marginTop: '12px',
};

const link = {
  color: '#999',
  textDecoration: 'underline',
  fontSize: '11px',
};
