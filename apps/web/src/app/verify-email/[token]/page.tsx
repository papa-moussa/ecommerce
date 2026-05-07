'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { clientApi } from '@/lib/api';

type Status = 'pending' | 'success' | 'error';

// SEC-017: token comes from the URL path segment, not the query string —
// prevents the token from appearing in server access logs and Referer headers.
export default function VerifyEmailPage({ params }: { params: { token: string } }): JSX.Element {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    clientApi.auth
      .verifyEmail(params.token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
        setTimeout(() => router.replace('/compte'), 3000);
      })
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
      });
  }, [params.token, router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {status === 'pending' && (
        <>
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-ink/20 border-t-brand-ink" />
          <p className="text-brand-ink/60">Vérification en cours…</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
            ✓
          </div>
          <h1 className="font-serif text-2xl text-brand-ink">E-mail confirmé !</h1>
          <p className="mt-2 text-sm text-brand-ink/60">{message}</p>
          <p className="mt-1 text-xs text-brand-ink/40">Redirection vers votre compte…</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
            ✗
          </div>
          <h1 className="font-serif text-2xl text-brand-ink">Lien invalide</h1>
          <p className="mt-2 text-sm text-brand-ink/60">{message}</p>
          <button
            onClick={() => router.replace('/connexion')}
            className="mt-6 rounded-full bg-brand-ink px-6 py-2.5 text-sm font-medium text-brand-ivory transition-colors hover:bg-brand-gold"
          >
            Retour à la connexion
          </button>
        </>
      )}
    </div>
  );
}
