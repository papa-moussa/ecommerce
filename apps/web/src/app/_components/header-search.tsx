'use client';

import { Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { InstantSearch, SearchBox, useInstantSearch } from 'react-instantsearch';

import { searchClient } from '@/lib/algolia';
import { useCurrency } from '@/lib/currency';

interface SearchHit {
  objectID: string;
  slug: string;
  name: string;
  brand: string;
  priceCents: number;
  imageUrl?: string;
}

function SearchResults({ onClose }: { onClose: () => void }) {
  const { results, status } = useInstantSearch();
  const { format } = useCurrency();
  const isLoading = status === 'loading' || status === 'stalled';

  if (isLoading && results.nbHits === 0) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="mx-auto animate-spin text-brand-gold" size={24} />
      </div>
    );
  }

  if (results.nbHits === 0) {
    return (
      <div className="p-8 text-center text-sm text-brand-ink/40">
        Aucun produit trouvé pour cette recherche.
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto p-2">
      <div className="grid grid-cols-1 gap-1">
        {(results.hits as unknown as SearchHit[]).map((hit) => (
          <Link
            key={hit.objectID}
            href={`/produits/${hit.slug}`}
            onClick={onClose}
            className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-brand-ivory"
          >
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {hit.imageUrl && (
                <Image src={hit.imageUrl} alt={hit.name} fill className="object-cover" />
              )}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                {hit.brand}
              </p>
              <h4 className="truncate text-sm font-medium text-brand-ink">{hit.name}</h4>
              <p className="text-xs text-brand-ink/40">{format(hit.priceCents)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!searchClient) return null;

  return (
    <div ref={containerRef} className="relative z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-brand-ink/60 hover:text-brand-ink transition-colors flex items-center justify-center rounded-full hover:bg-brand-gold/5"
          aria-label="Rechercher"
        >
          <Search size={20} />
        </button>
      ) : (
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[300px] md:w-[400px]">
          <div className="flex items-center gap-3 border-b border-brand-ink/20 pb-2 bg-brand-ivory/95 px-2">
            <Search size={18} className="text-brand-gold" />
            <div className="flex-grow">
              <InstantSearch searchClient={searchClient} indexName="products">
                <SearchBox
                  autoFocus
                  placeholder="Rechercher une création..."
                  classNames={{
                    root: 'w-full',
                    form: 'relative flex items-center',
                    input:
                      'w-full bg-transparent text-sm font-medium text-brand-ink focus:outline-none border-none p-0 placeholder:text-brand-ink/30',
                    submit: 'hidden',
                    reset: 'hidden',
                    loadingIndicator: 'hidden',
                  }}
                />
                <div className="absolute top-full left-0 mt-4 w-full rounded-xl border border-brand-gold/10 bg-white shadow-2xl overflow-hidden">
                  <SearchResults onClose={() => setIsOpen(false)} />
                  <div className="border-t border-brand-ink/5 p-3 bg-brand-ivory/30">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/produits');
                      }}
                      className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-gold transition-colors"
                    >
                      Voir tous les résultats
                    </button>
                  </div>
                </div>
              </InstantSearch>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-brand-ink/40 hover:text-brand-ink p-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
