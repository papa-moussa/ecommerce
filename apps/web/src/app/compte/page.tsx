'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { clientApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ComptePage(): JSX.Element | null {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/connexion?redirect=/compte');
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl text-brand-ink">Mon compte</h1>

      {!user.emailVerified && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <p>
            Votre adresse e-mail n&apos;est pas encore vérifiée. Consultez votre boîte mail ou{' '}
            <button
              onClick={() => {
                clientApi.auth
                  .resendVerification()
                  .then(() => setResendStatus('sent'))
                  .catch(() => setResendStatus('error'));
              }}
              className="font-medium underline hover:no-underline"
            >
              renvoyez l&apos;e-mail de confirmation
            </button>
            .
          </p>
          {resendStatus === 'sent' && (
            <span className="shrink-0 text-green-700">E-mail envoyé ✓</span>
          )}
          {resendStatus === 'error' && (
            <span className="shrink-0 text-red-600">Erreur, réessayez.</span>
          )}
        </div>
      )}

      <div className="rounded-xl border border-brand-ink/10 bg-white p-6">
        <h2 className="mb-4 font-serif text-lg text-brand-ink">Informations personnelles</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-brand-ink/5 pb-3">
            <dt className="text-brand-ink/50">Nom</dt>
            <dd className="font-medium text-brand-ink">
              {user.firstName} {user.lastName}
            </dd>
          </div>
          <div className="flex justify-between border-b border-brand-ink/5 pb-3">
            <dt className="text-brand-ink/50">Email</dt>
            <dd className="font-medium text-brand-ink">{user.email}</dd>
          </div>
          <div className="flex justify-between border-b border-brand-ink/5 pb-3">
            <dt className="text-brand-ink/50">Email vérifié</dt>
            <dd className="font-medium text-brand-ink">{user.emailVerified ? '✓ Oui' : 'Non'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-ink/50">Membre depuis</dt>
            <dd className="font-medium text-brand-ink">
              {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
              })}
            </dd>
          </div>
        </dl>
      </div>

      <button
        onClick={() => void handleLogout()}
        className="mt-8 text-sm text-brand-ink/40 transition-colors hover:text-brand-ink"
      >
        Se déconnecter
      </button>
    </div>
  );
}
