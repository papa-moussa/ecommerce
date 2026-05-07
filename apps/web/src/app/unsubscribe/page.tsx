'use client';

import { useState } from 'react';

import { clientApi } from '@/lib/api';

export default function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      await clientApi.auth.unsubscribe(email);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage((error as Error).message || "Une erreur s'est produite.");
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-4 font-serif text-3xl text-brand-ink">Désinscription</h1>

        {status === 'success' ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-8">
            <p className="text-green-800">
              Votre adresse e-mail a été retirée de notre liste de diffusion. Vous ne recevrez plus
              de rappels de panier.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-8 text-brand-ink/70">
              Saisissez votre adresse e-mail ci-dessous pour ne plus recevoir d'offres
              promotionnelles ni de rappels de panier.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  required
                  placeholder="votre.email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-full border border-brand-ink/20 px-6 py-3 outline-none focus:border-brand-gold"
                />
              </div>

              {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-full bg-brand-ink py-3 font-medium text-brand-ivory transition-colors hover:bg-brand-gold disabled:opacity-50"
              >
                {status === 'loading' ? 'Traitement...' : 'Me désinscrire'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
