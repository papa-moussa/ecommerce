'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';

// SEC-017: the API now sends /reinitialiser-mot-de-passe/<token> (path segment).
// This page handles legacy ?token= links that might still be in users' inboxes.
// It redirects to the canonical path-segment URL transparently.

function ResetPasswordRedirectContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Redirect to the new canonical path-segment URL
      void router.replace(`/reinitialiser-mot-de-passe/${token}`);
    }
  }, [token, router]);

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
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-ink/20 border-t-brand-ink" />
      <p className="text-brand-ink/60">Redirection…</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordRedirectContent />
    </Suspense>
  );
}
