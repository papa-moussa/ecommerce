'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Supported currencies + rates (relative to EUR)
// XOF is pegged to EUR: 1 EUR = 655.957 XOF (official fixed rate)
// ---------------------------------------------------------------------------
export type SupportedCurrency = 'XOF' | 'EUR' | 'USD';

export interface CurrencyConfig {
  code: SupportedCurrency;
  label: string;
  symbol: string;
  /** Rate vs EUR (1 EUR = X of this currency) */
  rateFromEur: number;
  locale: string;
  /** Number of fraction digits to display (XOF has 0 fractional digits) */
  fractionDigits: number;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  XOF: {
    code: 'XOF',
    label: 'Franc CFA',
    symbol: 'F CFA',
    rateFromEur: 655.957,
    locale: 'fr-SN',
    fractionDigits: 0,
  },
  EUR: {
    code: 'EUR',
    label: 'Euro',
    symbol: '€',
    rateFromEur: 1,
    locale: 'fr-FR',
    fractionDigits: 2,
  },
  USD: {
    code: 'USD',
    label: 'Dollar US',
    symbol: '$',
    rateFromEur: 1.08, // approximate, updated in Sprint 8 via API
    locale: 'en-US',
    fractionDigits: 2,
  },
};

const STORAGE_KEY = 'mp_currency';
const DEFAULT_CURRENCY: SupportedCurrency = 'XOF';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface CurrencyCtx {
  currency: CurrencyConfig;
  setCurrency: (code: SupportedCurrency) => void;
  /** Format a price stored in base currency (XOF) to the active currency */
  format: (baseAmount: number) => string;
  /** Convert base currency (XOF) to the active currency amount */
  convert: (baseAmount: number) => number;
}

const CurrencyContext = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<SupportedCurrency>(DEFAULT_CURRENCY);

  // Restore from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as SupportedCurrency | null;
      if (stored && stored in CURRENCIES) {
        setCurrencyCode(stored);
      }
    } catch {
      // SSR or blocked storage — use default
    }
  }, []);

  const setCurrency = useCallback((code: SupportedCurrency) => {
    setCurrencyCode(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const currency = CURRENCIES[currencyCode];

  const convert = useCallback(
    (baseAmount: number): number => {
      // Input baseAmount is assumed to be in XOF (from DB)
      if (currency.code === 'XOF') return baseAmount;

      // Convert XOF to EUR first (1 EUR = 655.957 XOF)
      const eurAmount = baseAmount / 655.957;

      if (currency.code === 'EUR') return eurAmount;

      // For USD, convert from EUR to USD
      if (currency.code === 'USD') {
        return eurAmount * CURRENCIES.USD.rateFromEur;
      }

      return baseAmount;
    },
    [currency],
  );

  const format = useCallback(
    (baseAmount: number): string => {
      const amount = convert(baseAmount);
      return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: currency.fractionDigits,
        maximumFractionDigits: currency.fractionDigits,
      }).format(amount);
    },
    [currency, convert],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyCtx {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>');
  return ctx;
}
