'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth';

export default function ConnexionPage(): JSX.Element {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/compte';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsPending(true);
    try {
      const result = await login(form);
      if (result.requires2FA) {
        const dest = result.role === 'ADMIN' ? '/admin' : redirect;
        router.push(
          `/verify-2fa?t=${encodeURIComponent(result.tempToken!)}&redirect=${encodeURIComponent(dest)}`,
        );
        return;
      }
      if (result.role === 'ADMIN' && !result.totpEnabled) {
        router.push('/admin/setup-2fa');
        return;
      }
      router.push(result.role === 'ADMIN' ? '/admin' : redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 font-serif text-3xl text-brand-ink">Connexion</h1>

        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-brand-ink/70" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-brand-ink/20 bg-white px-3 py-2.5 text-sm text-brand-ink placeholder-brand-ink/30 focus:border-brand-gold focus:outline-none"
              placeholder="vous@exemple.fr"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-brand-ink/70" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-brand-ink/20 bg-white px-3 py-2.5 text-sm text-brand-ink focus:border-brand-gold focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-brand-ink py-2.5 font-medium text-brand-ivory transition-colors hover:bg-brand-gold disabled:opacity-50"
          >
            {isPending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-brand-ink/50">
          <Link href="/mot-de-passe-oublie" className="hover:text-brand-ink">
            Mot de passe oublié ?
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-brand-ink/50">
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="text-brand-gold hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
