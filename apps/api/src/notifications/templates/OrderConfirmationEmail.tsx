import { Column, Hr, Row, Section, Text } from '@react-email/components';

import { BaseLayout } from './BaseLayout';

interface OrderConfirmationEmailProps {
  firstName: string;
  orderId: string;
  items: Array<{
    name: string;
    variantLabel?: string | null;
    qty: number;
    priceCents: number;
  }>;
  totalCents: number;
  currency: string;
}

export const OrderConfirmationEmail = ({
  firstName,
  orderId,
  items,
  totalCents,
  currency,
}: OrderConfirmationEmailProps) => {
  const shortId = orderId.slice(-8).toUpperCase();
  const fmt = (cents: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100);

  return (
    <BaseLayout preview={`Confirmation de votre commande #${shortId}`}>
      <Section style={section}>
        <Text style={h1}>Merci, {firstName} !</Text>
        <Text style={text}>
          Votre commande <strong>#{shortId}</strong> a bien été reçue et est en cours de traitement.
        </Text>

        <Hr style={hr} />

        <Section>
          {items.map((item, idx) => (
            <Row key={idx} style={itemRow}>
              <Column style={{ verticalAlign: 'top' }}>
                <Text style={itemName}>
                  {item.name}
                  {item.variantLabel && <span style={variantLabel}> ({item.variantLabel})</span>}
                </Text>
                <Text style={itemQty}>Quantité : {item.qty}</Text>
              </Column>
              <Column align="right" style={{ verticalAlign: 'top' }}>
                <Text style={itemPrice}>{fmt(item.priceCents * item.qty)}</Text>
              </Column>
            </Row>
          ))}
        </Section>

        <Hr style={hr} />

        <Section>
          <Row>
            <Column>
              <Text style={totalLabel}>Total</Text>
            </Column>
            <Column align="right">
              <Text style={totalValue}>{fmt(totalCents)}</Text>
            </Column>
          </Row>
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
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '8px',
};

const text = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '1.6',
  marginBottom: '24px',
};

const hr = {
  borderColor: '#eee',
  margin: '20px 0',
};

const itemRow = {
  marginBottom: '12px',
};

const itemName = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0',
};

const variantLabel = {
  color: '#999',
  fontWeight: 'normal',
};

const itemQty = {
  fontSize: '12px',
  color: '#777',
  margin: '4px 0 0',
};

const itemPrice = {
  fontSize: '14px',
  color: '#333',
  margin: '0',
};

const totalLabel = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1a1a1a',
};

const totalValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1a1a1a',
};
