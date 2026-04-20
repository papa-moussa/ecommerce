'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { clientApi } from '@/lib/api';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ResetPasswordPage(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage('Les mots de passe ne correspondent pas.');
      setStatus('error');
      return;
    }
    if (!token) {
      setMessage('Lien de réinitialisation invalide.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const res = await clientApi.auth.resetPassword(token, password);
      setMessage(res.message);
      setStatus('success');
      setTimeout(() => router.replace('/connexion'), 3000);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setStatus('error');
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-2xl text-brand-ink">Lien invalide</h1>
        <p className="mt-2 text-sm text-brand-ink/60">
          Ce lien de réinitialisation est invalide ou a expiré.
        </p>
        <Link
          href="/mot-de-passe-oublie"
          className="mt-6 rounded-full bg-brand-ink px-6 py-2.5 text-sm font-medium text-brand-ivory hover:bg-brand-gold"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="mb-2 font-serif text-3xl text-brand-ink">Nouveau mot de passe</h1>
      <p className="mb-8 text-sm text-brand-ink/60">Choisissez un mot de passe sécurisé.</p>

      {status === 'success' ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
          <p>{message}</p>
          <p className="mt-2 text-green-700">Redirection vers la connexion…</p>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50"
            >
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="mb-1 block text-xs uppercase tracking-widest text-brand-ink/50"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-brand-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
            />
          </div>

          {status === 'error' && <p className="text-sm text-red-600">{message}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-full bg-brand-ink py-3 text-sm font-medium text-brand-ivory transition-colors hover:bg-brand-gold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'loading' ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
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
