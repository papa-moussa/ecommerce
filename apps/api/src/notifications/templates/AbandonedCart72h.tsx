import { Button, Section, Text } from '@react-email/components';

import { BaseLayout } from './BaseLayout';

interface AbandonedCart72hProps {
  firstName: string;
  cartToken?: string;
  promoCode: string;
}

export const AbandonedCart72h = ({ firstName, cartToken, promoCode }: AbandonedCart72hProps) => {
  const checkoutUrl = cartToken
    ? `http://localhost:3002/checkout?token=${cartToken}`
    : 'http://localhost:3002/checkout';

  return (
    <BaseLayout preview="Une surprise pour vous 🎁">
      <Section style={section}>
        <Text style={h1}>Bonjour {firstName},</Text>
        <Text style={text}>
          Pour vous remercier de votre intérêt pour Maison Parfum, nous vous offrons 10% de
          réduction sur votre panier avec le code suivant :
        </Text>

        <Section style={promoBox}>
          <Text style={promoText}>{promoCode}</Text>
        </Section>

        <Section style={btnSection}>
          <Button style={{ ...button, padding: '14px 32px' }} href={checkoutUrl}>
            Utiliser mon code
          </Button>
        </Section>

        <Text style={footerText}>Ce code est valable pendant 48 heures seulement.</Text>
      </Section>
    </BaseLayout>
  );
};

const section = { padding: '0 32px' };
const h1 = { color: '#1a1a1a', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' };
const text = { color: '#555', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' };
const btnSection = { textAlign: 'center' as const, marginTop: '32px' };
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
  margin: '24px 0',
  padding: '16px',
  background: '#f9f9f9',
  border: '1px dashed #ccc',
};
const promoText = {
  fontSize: '24px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  color: '#1a1a1a',
  margin: '0',
};
const footerText = {
  fontSize: '12px',
  color: '#999',
  marginTop: '24px',
  textAlign: 'center' as const,
};
