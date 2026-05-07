import { Section, Text } from '@react-email/components';

import { BaseLayout } from './BaseLayout';

interface OrderStatusEmailProps {
  firstName: string;
  orderId: string;
  status: string;
  trackingNumber?: string | null;
}

export const OrderStatusEmail = ({
  firstName,
  orderId,
  status,
  trackingNumber,
}: OrderStatusEmailProps) => {
  const shortId = orderId.slice(-8).toUpperCase();

  const statusConfig: Record<string, { subject: string; body: string }> = {
    PROCESSING: {
      subject: `Votre commande #${shortId} est en préparation`,
      body: `Bonne nouvelle, ${firstName} ! Notre équipe prépare votre commande. Vous recevrez un e-mail dès l'expédition.`,
    },
    SHIPPED: {
      subject: `Votre commande #${shortId} est expédiée !`,
      body: `Votre commande a été confiée au transporteur.${trackingNumber ? ` Numéro de suivi : ${trackingNumber}` : ''}`,
    },
    DELIVERED: {
      subject: `Votre commande #${shortId} a été livrée`,
      body: `Votre commande a été livrée. Nous espérons que vous êtes pleinement satisfait(e).`,
    },
    CANCELLED: {
      subject: `Votre commande #${shortId} a été annulée`,
      body: `Votre commande a été annulée. Si vous avez des questions, contactez notre service client.`,
    },
    REFUNDED: {
      subject: `Remboursement de votre commande #${shortId}`,
      body: `Le remboursement de votre commande a été initié. Il apparaîtra sur votre relevé bancaire sous 5 à 10 jours ouvrés.`,
    },
  };

  const config = statusConfig[status] || {
    subject: `Mise à jour de votre commande #${shortId}`,
    body: `Le statut de votre commande a été mis à jour vers : ${status}.`,
  };

  return (
    <BaseLayout preview={config.subject}>
      <Section style={section}>
        <Text style={h1}>{config.subject}</Text>
        <Text style={text}>Bonjour {firstName},</Text>
        <Text style={text}>{config.body}</Text>
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
  fontSize: '14px',
  lineHeight: '1.6',
  marginBottom: '16px',
};
