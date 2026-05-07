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
    <div className="flex min-h-screen bg-brand-ivory">
      {/* Left Column - Editorial Image (Hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#080808]">
        <img
          src="https://images.unsplash.com/photo-1515347619152-c3a06e6df6dc?auto=format&fit=crop&q=80&w=1500"
          alt="Création Maison Parfum"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-12 left-12 text-white/90">
          <h2 className="font-serif text-4xl mb-2">Entrez dans la Maison</h2>
          <p className="text-sm font-medium tracking-widest uppercase opacity-70">
            Rejoignez notre cercle de passionnés
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <h1 className="font-serif text-4xl text-brand-ink mb-3">Créer un profil</h1>
            <p className="text-brand-ink/60 text-sm">
              Découvrez des créations exclusives et gérez vos signatures olfactives.
            </p>
          </div>

          <form onSubmit={(e) => void submit(e)} className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
                <input
                  id="firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="peer w-full border-b border-brand-ink/20 bg-transparent py-2 text-brand-ink focus:border-brand-gold focus:outline-none placeholder-transparent transition-colors shadow-none autofill:bg-transparent"
                  style={{
                    WebkitBoxShadow: '0 0 0px 1000px transparent inset',
                    transition: 'background-color 5000s ease-in-out 0s',
                  }}
                  placeholder="Prénom"
                />
                <label
                  htmlFor="firstName"
                  className="pointer-events-none absolute left-0 -top-4 text-xs text-brand-ink/40 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-brand-ink/40 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-gold"
                >
                  Prénom
                </label>
              </div>

              <div className="relative">
                <input
                  id="lastName"
                  type="text"
                  required
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="peer w-full border-b border-brand-ink/20 bg-transparent py-2 text-brand-ink focus:border-brand-gold focus:outline-none placeholder-transparent transition-colors shadow-none autofill:bg-transparent"
                  style={{
                    WebkitBoxShadow: '0 0 0px 1000px transparent inset',
                    transition: 'background-color 5000s ease-in-out 0s',
                  }}
                  placeholder="Nom"
                />
                <label
                  htmlFor="lastName"
                  className="pointer-events-none absolute left-0 -top-4 text-xs text-brand-ink/40 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-brand-ink/40 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-gold"
                >
                  Nom
                </label>
              </div>
            </div>

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
                minLength={8}
                autoComplete="new-password"
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
              <p className="absolute -bottom-5 left-0 text-[10px] text-brand-ink/30">
                8 caractères minimum
              </p>
            </div>

            {error && <p className="text-xs text-red-600 font-medium pt-2">{error}</p>}

            <div className="pt-6">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-brand-ink py-4 text-sm font-bold uppercase tracking-widest text-brand-ivory transition-colors hover:bg-brand-gold disabled:opacity-50"
              >
                {isPending ? 'Inscription en cours...' : 'Rejoindre la maison'}
              </button>
            </div>
          </form>

          <div className="mt-8 flex flex-col items-center space-y-4">
            <div className="w-12 h-[1px] bg-brand-gold/20"></div>

            <p className="text-xs text-brand-ink/50">
              Déjà membre ?{' '}
              <Link
                href="/connexion"
                className="font-bold text-brand-ink hover:text-brand-gold transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
