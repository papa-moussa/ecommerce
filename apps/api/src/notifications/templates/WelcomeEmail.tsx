import { Button, Section, Text } from '@react-email/components';

import { BaseLayout } from './BaseLayout';

interface WelcomeEmailProps {
  firstName: string;
  promoCode: string;
}

export const WelcomeEmail = ({ firstName, promoCode }: WelcomeEmailProps) => {
  return (
    <BaseLayout preview="Bienvenue chez Maison Parfum !">
      <Section style={section}>
        <Text style={h1}>Bienvenue parmi nous, {firstName} !</Text>
        <Text style={text}>
          Nous sommes ravis de vous compter parmi nos membres. Chez Maison Parfum, nous croyons que
          chaque fragrance raconte une histoire unique.
        </Text>

        <Text style={text}>
          Pour vous souhaiter la bienvenue, voici un cadeau spécial pour votre première commande :
        </Text>

        <Section style={promoBox}>
          <Text style={promoLabel}>VOTRE CODE PRIVILÈGE</Text>
          <Text style={promoText}>{promoCode}</Text>
          <Text style={promoSubtext}>-10% sur toute la boutique</Text>
        </Section>

        <Section style={btnSection}>
          <Button style={{ ...button, padding: '14px 32px' }} href="http://localhost:3002/produits">
            Découvrir nos fragrances
          </Button>
        </Section>

        <Text style={footerText}>
          Ce code est valable pendant 30 jours sur votre premier achat.
        </Text>
      </Section>
    </BaseLayout>
  );
};

const section = {
  padding: '0 32px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '16px',
};

const btnSection = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const button = {
  backgroundColor: '#1a1a1a',
  borderRadius: '99px',
  color: '#f5f0e8',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
};

const promoBox = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '24px',
  background: '#f5f0e8',
  borderRadius: '16px',
  border: '1px dashed #1a1a1a',
};

const promoLabel = {
  fontSize: '12px',
  letterSpacing: '2px',
  color: '#1a1a1a',
  opacity: 0.6,
  marginBottom: '8px',
};

const promoText = {
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '4px',
  color: '#1a1a1a',
  margin: '0',
};

const promoSubtext = {
  fontSize: '14px',
  color: '#1a1a1a',
  marginTop: '8px',
};

const footerText = {
  fontSize: '12px',
  color: '#999',
  marginTop: '40px',
  textAlign: 'center' as const,
};
