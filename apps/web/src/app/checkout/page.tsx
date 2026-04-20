'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

import { clientApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

// ---------------------------------------------------------------------------
// Inner checkout form (needs Stripe context)
// ---------------------------------------------------------------------------

interface CheckoutFormProps {
  orderId: string;
  totalCents: number;
  onSuccess: (orderId: string) => void;
}

function CheckoutForm({ orderId, totalCents, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setError('');

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation/${orderId}`,
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Paiement refusé.');
      setIsLoading(false);
    } else {
      onSuccess(orderId);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <PaymentElement />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isLoading || !stripe}
        className="w-full rounded-full bg-brand-ink py-3.5 font-medium text-brand-ivory transition-colors hover:bg-brand-gold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Traitement…' : `Payer ${formatPrice(totalCents)}`}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Shipping form
// ---------------------------------------------------------------------------

interface ShippingAddress {
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
}

const DEFAULT_ADDRESS: ShippingAddress = {
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  country: 'FR',
};

// ---------------------------------------------------------------------------
// Main checkout page
// ---------------------------------------------------------------------------

type Step = 'address' | 'payment';

export default function CheckoutPage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotalCents, clearCart } = useCartStore();

  const [step, setStep] = useState<Step>('address');
  const [address, setAddress] = useState<ShippingAddress>(DEFAULT_ADDRESS);
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    if (!user) router.replace('/connexion?redirect=/checkout');
  }, [user, router]);

  if (items.length === 0 && !clientSecret) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center text-center px-4">
        <p className="font-serif text-2xl text-brand-ink">Votre panier est vide.</p>
        <button
          onClick={() => router.push('/produits')}
          className="mt-6 rounded-full bg-brand-ink px-6 py-2.5 text-sm text-brand-ivory hover:bg-brand-gold"
        >
          Découvrir le catalogue
        </button>
      </div>
    );
  }

  async function handleAddressSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsCreatingOrder(true);
    setOrderError('');

    try {
      const result = await clientApi.orders.create({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shippingAddress: {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          postalCode: address.postalCode,
          country: address.country,
        },
      });
      setClientSecret(result.clientSecret);
      setOrderId(result.orderId);
      setStep('payment');
    } catch (err: unknown) {
      setOrderError(
        err instanceof Error ? err.message : 'Erreur lors de la création de la commande.',
      );
    } finally {
      setIsCreatingOrder(false);
    }
  }

  function handlePaymentSuccess(paidOrderId: string) {
    clearCart();
    router.push(`/confirmation/${paidOrderId}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl text-brand-ink">Commande</h1>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left — form */}
        <div>
          {step === 'address' && (
            <>
              <h2 className="mb-4 font-serif text-lg text-brand-ink">Adresse de livraison</h2>
              <form onSubmit={(e) => void handleAddressSubmit(e)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50">
                    Adresse
                  </label>
                  <input
                    required
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                    placeholder="12 rue de la Paix"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50">
                    Complément (optionnel)
                  </label>
                  <input
                    value={address.line2}
                    onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50">
                      Code postal
                    </label>
                    <input
                      required
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50">
                      Ville
                    </label>
                    <input
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50">
                    Pays
                  </label>
                  <select
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                  >
                    <option value="FR">France</option>
                    <option value="BE">Belgique</option>
                    <option value="CH">Suisse</option>
                    <option value="LU">Luxembourg</option>
                  </select>
                </div>

                {orderError && <p className="text-sm text-red-600">{orderError}</p>}

                <button
                  type="submit"
                  disabled={isCreatingOrder}
                  className="w-full rounded-full bg-brand-ink py-3 text-sm font-medium text-brand-ivory transition-colors hover:bg-brand-gold disabled:opacity-50"
                >
                  {isCreatingOrder ? 'Préparation…' : 'Continuer vers le paiement'}
                </button>
              </form>
            </>
          )}

          {step === 'payment' && clientSecret && (
            <>
              <h2 className="mb-4 font-serif text-lg text-brand-ink">Paiement sécurisé</h2>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: { colorPrimary: '#1a1a1a', borderRadius: '8px' },
                  },
                }}
              >
                <CheckoutForm
                  orderId={orderId}
                  totalCents={subtotalCents()}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </>
          )}
        </div>

        {/* Right — order summary */}
        <div className="rounded-xl border border-brand-ink/10 bg-white p-6">
          <h2 className="mb-4 font-serif text-lg text-brand-ink">Récapitulatif</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.variantId ?? 'default'}`}
                className="flex justify-between text-sm"
              >
                <span className="text-brand-ink/70">
                  {item.name}
                  {item.sizeMl ? ` — ${item.sizeMl} ml` : ''}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                </span>
                <span className="font-medium text-brand-ink">
                  {formatPrice(item.unitPriceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-brand-ink/10 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-brand-ink/60">Livraison</span>
              <span className="text-brand-ink/60">Offerte</span>
            </div>
            <div className="mt-3 flex justify-between font-medium text-brand-ink">
              <span>Total</span>
              <span>{formatPrice(subtotalCents())}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
