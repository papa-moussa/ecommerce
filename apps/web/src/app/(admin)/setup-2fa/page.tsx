'use client';

import Image from 'next/image';
import { useState } from 'react';

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
interface EnableResponse {
  backupCodes: string[];
}

type Step = 'init' | 'scan' | 'confirm' | 'done';

export default function Setup2FAPage() {
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
      const data = await apiFetch<SetupResponse>('/auth/2fa/setup', { method: 'POST' });
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
      const data = await apiFetch<EnableResponse>('/auth/2fa/enable', {
        method: 'POST',
        json: { code },
      });
      setBackupCodes(data.backupCodes);
      setStep('done');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Authentification à deux facteurs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Protège votre compte admin avec un code TOTP.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

        {step === 'init' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Vous aurez besoin d&apos;une application d&apos;authentification (Google
              Authenticator, Authy, 1Password…).
            </p>
            <button
              onClick={startSetup}
              disabled={loading}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Génération…' : 'Configurer la 2FA'}
            </button>
          </div>
        )}

        {step === 'scan' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Scannez ce QR code avec votre application :</p>
            {qr && (
              <div className="flex justify-center">
                <Image
                  src={qr}
                  alt="QR Code 2FA"
                  width={200}
                  height={200}
                  className="rounded border"
                />
              </div>
            )}
            <details className="text-xs text-gray-400">
              <summary className="cursor-pointer hover:text-gray-600">Clé manuelle</summary>
              <code className="block mt-1 font-mono break-all bg-gray-50 rounded px-2 py-1">
                {secret}
              </code>
            </details>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Code de vérification
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full border rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono"
                maxLength={6}
              />
            </div>
            <button
              onClick={confirmEnable}
              disabled={loading || code.length < 6}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Vérification…' : 'Activer la 2FA'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-medium text-gray-900">2FA activée avec succès !</p>
              <p className="text-sm text-gray-500 mt-1">
                Conservez précieusement vos codes de secours.
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wide">
                Codes de secours (usage unique)
              </p>
              <ul className="space-y-1">
                {backupCodes.map((c) => (
                  <li key={c} className="font-mono text-sm text-amber-900">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Ces codes ne seront plus affichés. Notez-les dans un endroit sûr.
            </p>
            <a
              href="/admin"
              className="block w-full text-center py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Retour au dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
