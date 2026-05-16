'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function apiFetch<T>(
  path: string,
  init?: Omit<RequestInit, 'body'> & { json?: unknown },
): Promise<T> {
  const { json, ...fetchInit } = init ?? {};
  const res = await fetch(`${BASE}${path}`, {
    ...fetchInit,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...fetchInit.headers },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error((b as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

interface SetupResponse {
  qrDataUrl: string;
  secret: string;
  otpauthUrl: string;
}
interface ForcedEnableResponse {
  backupCodes: string[];
  accessToken: string;
}

type Step = 'init' | 'scan' | 'confirm' | 'done';

function Setup2FAForm() {
  const params = useSearchParams();
  const tempToken = params.get('t') ?? '';
  const isForced = !!tempToken;

  const [step, setStep] = useState<Step>('init');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError('');
    try {
      let data: SetupResponse;
      if (isForced) {
        data = await apiFetch<SetupResponse>('/auth/2fa/setup-init', {
          method: 'POST',
          json: { tempToken },
        });
      } else {
        data = await apiFetch<SetupResponse>('/auth/2fa/setup', { method: 'POST' });
      }
      setQr(data.qrDataUrl);
      setSecret(data.secret);
      setStep('scan');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const confirmEnable = async () => {
    if (code.length < 6) {
      setError('Code à 6 chiffres requis.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isForced) {
        const data = await apiFetch<ForcedEnableResponse>('/auth/2fa/finish-setup', {
          method: 'POST',
          json: { tempToken, code },
        });
        setBackupCodes(data.backupCodes);
      } else {
        const data = await apiFetch<{ backupCodes: string[] }>('/auth/2fa/enable', {
          method: 'POST',
          json: { code },
        });
        setBackupCodes(data.backupCodes);
      }
      setStep('done');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="admin-card p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-ink">
            Authentification à deux facteurs
          </h1>
          <p className="mt-1 text-sm text-brand-ink/40 font-medium">
            {isForced
              ? 'La 2FA est obligatoire pour les comptes admin. Configurez-la pour accéder au panneau.'
              : 'Protège votre compte admin avec un code TOTP.'}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {step === 'init' && (
          <div className="space-y-4">
            <p className="text-sm text-brand-ink/60">
              Vous aurez besoin d&apos;une application d&apos;authentification (Google
              Authenticator, Authy, 1Password…).
            </p>
            <button
              onClick={startSetup}
              disabled={loading}
              className="admin-btn-primary w-full justify-center py-3"
            >
              {loading ? 'Génération…' : 'Configurer la 2FA'}
            </button>
          </div>
        )}

        {step === 'scan' && (
          <div className="space-y-4">
            <p className="text-sm text-brand-ink/60">Scannez ce QR code avec votre application :</p>
            {qr && (
              <div className="flex justify-center">
                <div className="p-3 rounded-2xl border border-brand-ink/[0.06] bg-white">
                  <Image src={qr} alt="QR Code 2FA" width={180} height={180} />
                </div>
              </div>
            )}
            <details className="text-xs text-brand-ink/30">
              <summary className="cursor-pointer hover:text-brand-ink/60 font-medium transition-colors">
                Clé manuelle
              </summary>
              <code className="block mt-2 font-mono break-all bg-brand-ivory/60 border border-brand-ink/[0.06] rounded-xl px-3 py-2 text-brand-ink/60">
                {secret}
              </code>
            </details>
            <div>
              <label className="admin-label block mb-1.5">Code de vérification</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="admin-input text-center tracking-[0.3em] font-mono text-lg"
                maxLength={6}
              />
            </div>
            <button
              onClick={confirmEnable}
              disabled={loading || code.length < 6}
              className="admin-btn-primary w-full justify-center py-3"
            >
              {loading ? 'Vérification…' : 'Activer la 2FA'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-serif font-bold text-xl text-brand-ink">2FA activée !</p>
              <p className="text-sm text-brand-ink/40 mt-1 font-medium">
                Conservez précieusement vos codes de secours.
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
              <p className="admin-label text-amber-700 mb-3">Codes de secours (usage unique)</p>
              <ul className="space-y-1.5">
                {backupCodes.map((c) => (
                  <li key={c} className="font-mono text-sm text-amber-900 font-medium">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-brand-ink/30 text-center">
              Ces codes ne seront plus affichés. Notez-les dans un endroit sûr.
            </p>
            <a href="/admin" className="admin-btn-primary w-full justify-center py-3">
              Accéder au dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Setup2FAPage() {
  return (
    <Suspense>
      <Setup2FAForm />
    </Suspense>
  );
}
