import { Button, Section, Text } from '@react-email/components';

import { BaseLayout } from './BaseLayout';

interface ReviewRequestEmailProps {
  firstName: string;
  orderId: string;
}

export const ReviewRequestEmail = ({ firstName, orderId }: ReviewRequestEmailProps) => {
  const accountUrl = 'http://localhost:3002/compte/commandes/' + orderId;

  return (
    <BaseLayout preview="Votre avis nous intéresse !">
      <Section style={section}>
        <Text style={h1}>Bonjour {firstName},</Text>
        <Text style={text}>
          Il y a quelques jours, vous receviez votre commande chez Maison Parfum. Nous espérons que
          vos nouvelles fragrances vous plaisent !
        </Text>
        <Text style={text}>
          Votre avis est précieux pour nous et pour la communauté. Pourriez-vous prendre un instant
          pour partager votre expérience ?
        </Text>

        <Section style={btnSection}>
          <Button style={{ ...button, padding: '14px 32px' }} href={accountUrl}>
            Donner mon avis
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
