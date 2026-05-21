'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { useAuth } from '@/lib/auth';

function ConnexionPageContent(): JSX.Element {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams.get('redirect');
  const redirect = explicitRedirect ?? '/compte';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsPending(true);
    try {
      const result = await login(form);

      // Admins always land on the admin console, whatever the redirect param says.
      const adminDest = result.role === 'ADMIN' ? '/admin' : redirect;

      if (result.requires2FA) {
        router.push(
          `/verify-2fa?t=${encodeURIComponent(result.tempToken!)}&redirect=${encodeURIComponent(adminDest)}`,
        );
        return;
      }
      if (result.requires2FASetup) {
        router.push(`/admin/setup-2fa?t=${encodeURIComponent(result.tempToken!)}`);
        return;
      }
      router.push(adminDest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-ivory">
      {/* Left Column - Editorial Image (Hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#080808]">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1500"
          alt="Campagne Maison Parfum"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-12 left-12 text-white/90">
          <h2 className="font-serif text-4xl mb-2">Signature Privée</h2>
          <p className="text-sm font-medium tracking-widest uppercase opacity-70">
            Accédez à votre collection
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <h1 className="font-serif text-4xl text-brand-ink mb-3">Connexion</h1>
            <p className="text-brand-ink/60 text-sm">
              Veuillez vous identifier pour accéder à vos privilèges.
            </p>
          </div>

          <form onSubmit={(e) => void submit(e)} className="space-y-8">
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="peer w-full border-b border-brand-ink/20 bg-transparent py-2 text-brand-ink focus:border-brand-gold focus:outline-none placeholder-transparent transition-colors shadow-none autofill:bg-transparent"
                style={{
                  WebkitBoxShadow: '0 0 0px 1000px transparent inset',
                  transition: 'background-color 5000s ease-in-out 0s',
                }}
                placeholder="Email"
              />
              <label
                htmlFor="email"
                className="pointer-events-none absolute left-0 -top-4 text-xs text-brand-ink/40 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-brand-ink/40 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-gold"
              >
                Adresse email
              </label>
            </div>

            <div className="relative">
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="peer w-full border-b border-brand-ink/20 bg-transparent py-2 text-brand-ink focus:border-brand-gold focus:outline-none placeholder-transparent transition-colors shadow-none autofill:bg-transparent"
                style={{
                  WebkitBoxShadow: '0 0 0px 1000px transparent inset',
                  transition: 'background-color 5000s ease-in-out 0s',
                }}
                placeholder="Mot de passe"
              />
              <label
                htmlFor="password"
                className="pointer-events-none absolute left-0 -top-4 text-xs text-brand-ink/40 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-brand-ink/40 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-gold"
              >
                Mot de passe
              </label>
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-brand-ink py-4 text-sm font-bold uppercase tracking-widest text-brand-ivory transition-colors hover:bg-brand-gold disabled:opacity-50"
              >
                {isPending ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </div>
          </form>

          <div className="mt-8 flex flex-col items-center space-y-4">
            <Link
              href="/mot-de-passe-oublie"
              className="text-xs text-brand-ink/50 hover:text-brand-ink transition-colors"
            >
              Mot de passe oublié ?
            </Link>

            <div className="w-12 h-[1px] bg-brand-gold/20"></div>

            <p className="text-xs text-brand-ink/50">
              Pas encore de compte ?{' '}
              <Link
                href="/inscription"
                className="font-bold text-brand-ink hover:text-brand-gold transition-colors"
              >
                Créer un profil
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-ivory flex items-center justify-center">
          Chargement...
        </div>
      }
    >
      <ConnexionPageContent />
    </Suspense>
  );
}
