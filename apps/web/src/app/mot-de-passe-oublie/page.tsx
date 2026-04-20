'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { clientApi } from '@/lib/api';

type Status = 'idle' | 'loading' | 'sent' | 'error';

export default function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await clientApi.auth.forgotPassword(email);
      setMessage(res.message);
      setStatus('sent');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setStatus('error');
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="mb-2 font-serif text-3xl text-brand-ink">Mot de passe oublié</h1>
      <p className="mb-8 text-sm text-brand-ink/60">
        Saisissez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.
      </p>

      {status === 'sent' ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
          <p>{message}</p>
          <p className="mt-2 text-green-700">
            Vérifiez votre boîte mail (et vos spams). Le lien expire dans&nbsp;1&nbsp;h.
          </p>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50"
            >
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
            />
          </div>

          {status === 'error' && <p className="text-sm text-red-600">{message}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-full bg-brand-ink py-3 text-sm font-medium text-brand-ivory transition-colors hover:bg-brand-gold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'loading' ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-brand-ink/40">
        <Link href="/connexion" className="hover:text-brand-ink">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
