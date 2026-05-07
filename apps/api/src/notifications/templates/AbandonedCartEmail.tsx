import { Button, Section, Text } from '@react-email/components';

import { BaseLayout } from './BaseLayout';

interface AbandonedCartEmailProps {
  firstName: string;
  stage: number;
  promoCode?: string;
  cartToken?: string;
}

export const AbandonedCartEmail = ({
  firstName,
  stage,
  promoCode,
  cartToken,
}: AbandonedCartEmailProps) => {
  let title = 'Vous avez oublié quelque chose ?';
  let body =
    "Nous avons remarqué que vous n'avez pas finalisé votre commande. Vos articles vous attendent sagement dans votre panier.";
  let buttonText = 'Retourner à mon panier';

  if (stage === 2) {
    title = 'Vos parfums favoris vous attendent !';
    body = "N'hésitez plus, finalisez votre commande avant que nos stocks ne soient épuisés.";
    buttonText = 'Finaliser ma commande';
  } else if (stage === 3) {
    title = 'Une surprise pour vous 🎁';
    body =
      'Pour vous remercier de votre intérêt pour Maison Parfum, nous vous offrons 10% de réduction sur votre commande avec le code :';
    buttonText = 'Utiliser mon code';
  }

  const checkoutUrl = cartToken
    ? `http://localhost:3002/checkout?token=${cartToken}`
    : 'http://localhost:3002/checkout';

  return (
    <BaseLayout preview={title}>
      <Section style={section}>
        <Text style={h1}>Bonjour {firstName},</Text>
        <Text style={text}>{body}</Text>

        {stage === 3 && promoCode && (
          <Section style={promoBox}>
            <Text style={promoText}>{promoCode}</Text>
          </Section>
        )}

        <Section style={btnSection}>
          <Button style={{ ...button, padding: '14px 32px' }} href={checkoutUrl}>
            {buttonText}
          </Button>
        </Section>
      </Section>
    </BaseLayout>
  );
};

const section = {
  padding: '0 32px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '24px',
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
