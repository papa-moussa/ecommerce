'use client';

import { useState } from 'react';

import { CURRENCIES, type SupportedCurrency, useCurrency } from '@/lib/currency';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  const options = Object.values(CURRENCIES);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-brand-ink/10 px-3 py-1 text-xs font-medium text-brand-ink/60 transition-colors hover:border-brand-gold hover:text-brand-ink"
        aria-label="Sélectionner la devise"
        aria-expanded={open}
      >
        {/* <span className="text-brand-gold font-semibold">{currency.symbol}</span> */}
        <span>{currency.code}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="currentColor"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M1 3l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-brand-ink/10 bg-brand-ivory shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.code}
                onClick={() => {
                  setCurrency(opt.code as SupportedCurrency);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-brand-gold/10 ${
                  currency.code === opt.code ? 'font-semibold text-brand-ink' : 'text-brand-ink/60'
                }`}
              >
                <span className="w-12 font-mono text-xs text-brand-gold">{opt.symbol}</span>
                <span className="flex-1">{opt.label}</span>
                {currency.code === opt.code && <span className="text-brand-gold">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
