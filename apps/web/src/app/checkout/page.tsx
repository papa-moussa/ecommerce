'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Banknote, CreditCard } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, Suspense, useEffect, useState } from 'react';

import { clientApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCartStore } from '@/lib/cart-store';
import { useCurrency } from '@/lib/currency';

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
  const { format } = useCurrency();
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
        {isLoading ? 'Traitement…' : `Payer ${format(totalCents)}`}
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

const REGIONS: Record<string, string[]> = {
  SN: [
    'Dakar',
    'Thiès',
    'Saint-Louis',
    'Diourbel',
    'Fatick',
    'Kaffrine',
    'Kaolack',
    'Kédougou',
    'Kolda',
    'Louga',
    'Matam',
    'Sédhiou',
    'Tambacounda',
    'Ziguinchor',
  ],
  GM: ['Banjul', 'Kanifing', 'Brikama', 'Mansa Konko', 'Kerewan', 'Janjanbureh', 'Basse Santa Su'],
};

const DEFAULT_ADDRESS: ShippingAddress = {
  line1: '',
  line2: '',
  city: '', // This will store the Region
  postalCode: '',
  country: 'SN',
};

// ---------------------------------------------------------------------------
// Main checkout page
// ---------------------------------------------------------------------------

type Step = 'address' | 'payment';

function CheckoutPageContent(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotalCents, clearCart, setItems } = useCartStore();
  const { format } = useCurrency();

  const [step, setStep] = useState<Step>('address');
  const [address, setAddress] = useState<ShippingAddress>(DEFAULT_ADDRESS);
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'CASH_ON_DELIVERY'>('ONLINE');

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountCents: number } | null>(
    null,
  );
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const searchParams = useSearchParams();
  const recoveryToken = searchParams.get('token');
  const [isRecovering, setIsRecovering] = useState(!!recoveryToken);

  // Removed mandatory redirect for guest checkout

  useEffect(() => {
    if (recoveryToken && user && isRecovering) {
      clientApi.cart
        .recover(recoveryToken)
        .then((result) => {
          const recoveredItems = result.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || undefined,
            name: item.name,
            brand: 'Maison Parfum', // Default or fetch
            unitPriceCents: item.unitPriceCents,
            quantity: item.quantity,
            stock: item.stockAvailable ?? 100,
          }));
          setItems(recoveredItems);
          setIsRecovering(false);
          router.replace('/checkout'); // clean URL
        })
        .catch(() => {
          setIsRecovering(false);
        });
    }
  }, [recoveryToken, user, isRecovering, setItems, router]);

  if (isRecovering) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-ink border-t-transparent mx-auto"></div>
          <p className="font-serif text-xl text-brand-ink">Récupération de votre panier...</p>
        </div>
      </div>
    );
  }

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
        promoCode: appliedPromo?.code,
        paymentMethod,
        email: email,
        phone: phone,
      });
      setClientSecret(result.clientSecret);
      setOrderId(result.orderId);

      // If COD, we can immediately finish or go to a summary step.
      // For now, let's go to the 'payment' step but show a different UI.
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

  async function handleApplyPromo(e: FormEvent) {
    e.preventDefault();
    if (!promoCode) return;
    setIsApplyingPromo(true);
    setPromoError('');
    try {
      const res = await clientApi.cart.applyPromo(promoCode, subtotalCents());
      setAppliedPromo({ code: res.code, discountCents: res.discountCents });
      setPromoCode(''); // clear input on success
    } catch (err) {
      setPromoError((err as Error).message || 'Code invalide');
      setAppliedPromo(null);
    } finally {
      setIsApplyingPromo(false);
    }
  }

  const finalTotalCents = subtotalCents() - (appliedPromo?.discountCents ?? 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl text-brand-ink">Commande</h1>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left — form */}
        <div>
          {step === 'address' && (
            <>
              <div className="mb-8 p-6 bg-brand-gold/5 rounded-2xl border border-brand-gold/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-lg text-brand-ink">Informations de contact</h2>
                  {!user && (
                    <button
                      onClick={() => router.push('/connexion?redirect=/checkout')}
                      className="text-xs text-brand-gold hover:underline font-medium"
                    >
                      Déjà un compte ? Se connecter
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50">
                      E-mail
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!user}
                      className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50">
                      Téléphone
                    </label>
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                      placeholder="Numéro de téléphone ..."
                    />
                  </div>
                </div>
              </div>
              <h2 className="mb-4 font-serif text-lg text-brand-ink">Adresse de livraison</h2>
              <form onSubmit={(e) => void handleAddressSubmit(e)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50">
                    Pays
                  </label>
                  <select
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value, city: '' })}
                    className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                  >
                    <option value="SN">Sénégal</option>
                    <option value="GM">Gambie</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50">
                      Région
                    </label>
                    <select
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                    >
                      <option value="">Sélectionner</option>
                      {(REGIONS[address.country] || []).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
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
                </div>

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50">
                    Adresse
                  </label>
                  <input
                    required
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                    placeholder="Quartier, Rue, Porte..."
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

                <div className="pt-6 border-t border-brand-ink/10">
                  <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
                    Mode de paiement
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label
                      className={`relative flex flex-col p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 ${
                        paymentMethod === 'ONLINE'
                          ? 'border-brand-gold bg-brand-gold/5 shadow-md scale-[1.02]'
                          : 'border-brand-ink/5 bg-white hover:border-brand-ink/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ONLINE"
                        className="hidden"
                        checked={paymentMethod === 'ONLINE'}
                        onChange={() => setPaymentMethod('ONLINE')}
                      />
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${
                          paymentMethod === 'ONLINE'
                            ? 'bg-brand-gold text-brand-ivory'
                            : 'bg-brand-ink/5 text-brand-ink/40'
                        }`}
                      >
                        <CreditCard size={20} />
                      </div>
                      <span className="font-serif text-base text-brand-ink">
                        Paiement par carte
                      </span>
                      <span className="text-[10px] text-brand-ink/40 uppercase tracking-wider mt-1">
                        Transaction sécurisée
                      </span>

                      {paymentMethod === 'ONLINE' && (
                        <div className="absolute top-4 right-4 w-5 h-5 bg-brand-gold rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </label>

                    <label
                      className={`relative flex flex-col p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 ${
                        paymentMethod === 'CASH_ON_DELIVERY'
                          ? 'border-brand-gold bg-brand-gold/5 shadow-md scale-[1.02]'
                          : 'border-brand-ink/5 bg-white hover:border-brand-ink/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CASH_ON_DELIVERY"
                        className="hidden"
                        checked={paymentMethod === 'CASH_ON_DELIVERY'}
                        onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                      />
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${
                          paymentMethod === 'CASH_ON_DELIVERY'
                            ? 'bg-brand-gold text-brand-ivory'
                            : 'bg-brand-ink/5 text-brand-ink/40'
                        }`}
                      >
                        <Banknote size={20} />
                      </div>
                      <span className="font-serif text-base text-brand-ink">
                        Paiement à la livraison
                      </span>
                      <span className="text-[10px] text-brand-ink/40 uppercase tracking-wider mt-1">
                        Espèces ou TPE
                      </span>

                      {paymentMethod === 'CASH_ON_DELIVERY' && (
                        <div className="absolute top-4 right-4 w-5 h-5 bg-brand-gold rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </label>
                  </div>
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

          {step === 'payment' && (
            <>
              {paymentMethod === 'ONLINE' && clientSecret ? (
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
                      totalCents={finalTotalCents}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                </>
              ) : (
                <div className="space-y-6 text-center py-8 bg-brand-gold/5 rounded-[2rem] border border-brand-gold/20">
                  <div className="mx-auto w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center text-brand-gold mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25c0-4.446-3.605-8.051-8.051-8.051H8.25m9.75 11.25H3.375m17.25 0V4.605a1.125 1.125 0 0 0-1.125-1.125H12.75V15"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-playfair font-bold text-brand-ink">
                    Confirmer votre commande
                  </h2>
                  <p className="text-sm text-brand-ink/60 px-8">
                    Vous avez choisi le paiement à la livraison. Le montant total de{' '}
                    <strong>{format(finalTotalCents)}</strong> sera à régler directement au livreur.
                  </p>
                  <div className="px-8 pb-4">
                    <button
                      onClick={() => handlePaymentSuccess(orderId)}
                      className="w-full rounded-full bg-brand-ink py-4 font-bold text-brand-ivory hover:bg-brand-gold transition-all uppercase tracking-widest text-xs"
                    >
                      Valider ma commande
                    </button>
                  </div>
                </div>
              )}
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
                  {format(item.unitPriceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-brand-ink/10 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-brand-ink/60">Livraison</span>
              <span className="text-brand-ink/60">Offerte</span>
            </div>

            {appliedPromo && (
              <div className="mt-2 flex justify-between text-sm text-green-600">
                <span>Code promo ({appliedPromo.code})</span>
                <span>-{format(appliedPromo.discountCents)}</span>
              </div>
            )}

            <div className="mt-3 flex justify-between font-medium text-brand-ink">
              <span>Total</span>
              <span>{format(finalTotalCents)}</span>
            </div>
          </div>

          {/* Promo code form */}
          {!appliedPromo && step === 'address' && (
            <div className="mt-6 border-t border-brand-ink/10 pt-6">
              <form onSubmit={(e) => void handleApplyPromo(e)} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Code promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 rounded-lg border border-brand-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-gold uppercase"
                />
                <button
                  type="submit"
                  disabled={!promoCode || isApplyingPromo}
                  className="rounded-lg bg-brand-ink px-4 py-2 text-sm font-medium text-white hover:bg-brand-gold disabled:opacity-50 transition-colors"
                >
                  {isApplyingPromo ? '...' : 'Appliquer'}
                </button>
              </form>
              {promoError && <p className="mt-2 text-xs text-red-600">{promoError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutPageContent />
    </Suspense>
  );
}
