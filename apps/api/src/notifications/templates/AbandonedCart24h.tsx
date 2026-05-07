import { Button, Section, Text } from '@react-email/components';

import { BaseLayout } from './BaseLayout';

interface AbandonedCart24hProps {
  firstName: string;
  cartToken?: string;
}

export const AbandonedCart24h = ({ firstName, cartToken }: AbandonedCart24hProps) => {
  const checkoutUrl = cartToken
    ? `http://localhost:3002/checkout?token=${cartToken}`
    : 'http://localhost:3002/checkout';

  return (
    <BaseLayout preview="Vos parfums favoris vous attendent !">
      <Section style={section}>
        <Text style={h1}>Bonjour {firstName},</Text>
        <Text style={text}>
          C'est le moment idéal pour vous faire plaisir. Vos articles préférés sont toujours
          réservés, mais nos stocks sont limités.
        </Text>

        <Section style={btnSection}>
          <Button style={{ ...button, padding: '14px 32px' }} href={checkoutUrl}>
            Finaliser ma commande
          </Button>
        </Section>
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
