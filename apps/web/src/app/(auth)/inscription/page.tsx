'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth';

export default function InscriptionPage(): JSX.Element {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsPending(true);
    try {
      await register(form);
      router.push('/compte');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 font-serif text-3xl text-brand-ink">Créer un compte</h1>

        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-brand-ink/70" htmlFor="firstName">
                Prénom
              </label>
              <input
                id="firstName"
                type="text"
                required
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full rounded-lg border border-brand-ink/20 bg-white px-3 py-2.5 text-sm text-brand-ink focus:border-brand-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-ink/70" htmlFor="lastName">
                Nom
              </label>
              <input
                id="lastName"
                type="text"
                required
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full rounded-lg border border-brand-ink/20 bg-white px-3 py-2.5 text-sm text-brand-ink focus:border-brand-gold focus:outline-none"
              />
            </div>
          </div>

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
              className="w-full rounded-lg border border-brand-ink/20 bg-white px-3 py-2.5 text-sm text-brand-ink focus:border-brand-gold focus:outline-none"
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
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-brand-ink/20 bg-white px-3 py-2.5 text-sm text-brand-ink focus:border-brand-gold focus:outline-none"
            />
            <p className="mt-1 text-xs text-brand-ink/40">8 caractères minimum</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-brand-ink py-2.5 font-medium text-brand-ivory transition-colors hover:bg-brand-gold disabled:opacity-50"
          >
            {isPending ? 'Inscription…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-ink/50">
          Déjà un compte ?{' '}
          <Link href="/connexion" className="text-brand-gold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
