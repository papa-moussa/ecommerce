import { Button, Section, Text } from '@react-email/components';

import { BaseLayout } from './BaseLayout';

interface AbandonedCart1hProps {
  firstName: string;
  cartToken?: string;
}

export const AbandonedCart1h = ({ firstName, cartToken }: AbandonedCart1hProps) => {
  const checkoutUrl = cartToken
    ? `http://localhost:3002/checkout?token=${cartToken}`
    : 'http://localhost:3002/checkout';

  return (
    <BaseLayout preview="Vous avez oublié quelque chose ?">
      <Section style={section}>
        <Text style={h1}>Bonjour {firstName},</Text>
        <Text style={text}>
          Nous avons remarqué que vous n'avez pas finalisé votre commande. Vos articles vous
          attendent sagement dans votre panier.
        </Text>

        <Section style={btnSection}>
          <Button style={{ ...button, padding: '14px 32px' }} href={checkoutUrl}>
            Retourner à mon panier
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
