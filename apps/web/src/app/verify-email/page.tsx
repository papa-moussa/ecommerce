'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

// SEC-017: the API now sends /verify-email/<token> (path segment).
// This page handles legacy ?token= links that might still be in users' inboxes.
// It redirects to the canonical path-segment URL transparently.

function VerifyEmailRedirectContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      void router.replace(`/verify-email/${token}`);
    } else {
      void router.replace('/connexion');
    }
  }, [token, router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-ink/20 border-t-brand-ink" />
      <p className="text-brand-ink/60">Vérification en cours…</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailRedirectContent />
    </Suspense>
  );
}
