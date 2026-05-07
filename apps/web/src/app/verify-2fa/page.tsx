'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { useAuth } from '@/lib/auth';

function Verify2FAForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { verify2FA } = useAuth();
  const tempToken = params.get('t') ?? '';
  const redirect = params.get('redirect') ?? '/admin';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setError('Code à 6 chiffres requis.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verify2FA(tempToken, code);
      router.push(redirect);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!tempToken) {
    return (
      <p className="text-center text-gray-500 mt-10">
        Session invalide.{' '}
        <a href="/connexion" className="underline">
          Se reconnecter
        </a>
      </p>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-3xl mb-2">🔐</div>
          <h1 className="text-lg font-semibold text-gray-900">Vérification 2FA</h1>
          <p className="mt-1 text-sm text-gray-500">
            Entrez le code de votre application d&apos;authentification.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 text-center">{error}</p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="000000"
            autoFocus
            className="w-full border rounded-lg px-4 py-3 text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-gray-900 focus:outline-none"
            maxLength={8}
          />
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Vérification…' : 'Confirmer'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400">
          Code de secours ? Saisissez-le à la place du code TOTP.
        </p>
      </div>
    </div>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense>
      <Verify2FAForm />
    </Suspense>
  );
}
