'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface FiltersProps {
  activeGender?: string;
  activeSort?: string;
}

const GENDERS = [
  { value: 'FEMME', label: 'Femme' },
  { value: 'HOMME', label: 'Homme' },
  { value: 'UNISEXE', label: 'Unisexe' },
] as const;

const SORTS = [
  { value: 'newest', label: 'Nouveautés' },
  { value: 'featured', label: 'Sélection' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
] as const;

export function ProductFilters({ activeGender, activeSort }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('cursor');
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/produits?${params.toString()}`);
    },
    [router, searchParams],
  );

  const btnCls = (active: boolean) =>
    `block w-full text-left text-sm py-1 transition-colors ${
      active ? 'font-semibold text-brand-ink' : 'text-brand-ink/50 hover:text-brand-ink'
    }`;

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-ink/40">
          Genre
        </p>
        <ul className="space-y-1">
          <li>
            <button className={btnCls(!activeGender)} onClick={() => update('gender', undefined)}>
              Tous
            </button>
          </li>
          {GENDERS.map((g) => (
            <li key={g.value}>
              <button
                className={btnCls(activeGender === g.value)}
                onClick={() => update('gender', activeGender === g.value ? undefined : g.value)}
              >
                {g.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-ink/40">
          Trier par
        </p>
        <ul className="space-y-1">
          {SORTS.map((s) => (
            <li key={s.value}>
              <button
                className={btnCls(activeSort === s.value)}
                onClick={() => update('sort', activeSort === s.value ? undefined : s.value)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
