'use client';

import type { ProductCard as ProductCardType } from '@ecommerce/shared-types';
import * as Slider from '@radix-ui/react-slider';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  ClearRefinements,
  Configure,
  CurrentRefinements,
  Hits,
  InstantSearch,
  Pagination,
  RefinementList,
  SearchBox,
  useInstantSearch,
  useRange,
  type UseRangeProps,
} from 'react-instantsearch';

import { useCurrency } from '@/lib/currency';

import { ProductCard } from '../../_components/product-card';

interface AlgoliaHit {
  objectID: string;
  slug: string;
  name: string;
  brand: string;
  priceCents: number;
  currency?: string;
  stockStatus?: string;
  imageUrl?: string;
  category?: string;
  variants?: unknown[]; // Better than any
}

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '';

const searchClient = appId && searchKey ? algoliasearch(appId, searchKey) : null;

function HitAdapter({ hit }: { hit: AlgoliaHit }) {
  // Adapter Algolia hit to ProductCard expected format
  const product = {
    id: hit.objectID,
    slug: hit.slug,
    name: hit.name,
    brand: hit.brand,
    priceCents: hit.priceCents,
    currency: hit.currency || 'XOF',
    stockStatus: (hit.stockStatus as unknown as 'IN_STOCK') || 'IN_STOCK',
    images: hit.imageUrl ? [{ url: hit.imageUrl, alt: hit.name }] : [],
    category: { name: hit.category || '' },
    variants: (hit.variants || []) as unknown as ProductCardType['variants'],
  };

  return <ProductCard product={product as unknown as ProductCardType} />;
}

function SearchFocus() {
  const searchParams = useSearchParams();
  const focus = searchParams.get('focus');

  useEffect(() => {
    if (focus === 'search') {
      const input = document.querySelector('.ais-SearchBox-input') as HTMLInputElement;
      if (input) input.focus();
    }
  }, [focus]);

  return null;
}

function EmptyState({ isQuizMode }: { isQuizMode: boolean }) {
  const { results } = useInstantSearch();

  if (results && results.nbHits === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-brand-gold/10 rounded-3xl bg-brand-ivory/20">
        <p className="text-brand-ink/60 mb-4">
          {isQuizMode
            ? "Désolé, nous n'avons pas trouvé de parfum correspondant exactement à vos réponses."
            : 'Aucun parfum ne correspond à votre recherche.'}
        </p>
        {isQuizMode && (
          <Link
            href="/quiz"
            className="text-sm text-brand-gold font-bold hover:underline underline-offset-4"
          >
            Réessayer le quiz avec d'autres critères
          </Link>
        )}
      </div>
    );
  }
  return null;
}

function RangeSlider(props: UseRangeProps) {
  const { format } = useCurrency();
  const { start, range, canRefine, refine } = useRange(props);
  const { min, max } = range;

  const [value, setValue] = useState([min || 0, max || 100000]);

  useEffect(() => {
    setValue([start[0] ?? min ?? 0, start[1] ?? max ?? 100000]);
  }, [start, min, max]);

  if (!canRefine || min === max) return null;

  return (
    <div className="px-2 pt-2 pb-6">
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={value}
        max={max}
        min={min}
        step={100}
        onValueChange={setValue}
        onValueCommit={(v) => refine([v[0], v[1]])}
      >
        <Slider.Track className="bg-brand-gold/20 relative grow rounded-full h-[3px]">
          <Slider.Range className="absolute bg-brand-gold rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-5 h-5 bg-white border-2 border-brand-gold shadow-lg rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-brand-gold/20 cursor-grab active:cursor-grabbing"
          aria-label="Min price"
        />
        <Slider.Thumb
          className="block w-5 h-5 bg-white border-2 border-brand-gold shadow-lg rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-brand-gold/20 cursor-grab active:cursor-grabbing"
          aria-label="Max price"
        />
      </Slider.Root>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] font-bold text-brand-ink/40">{format(value[0] || 0)}</span>
        <span className="text-[11px] font-bold text-brand-ink/40">{format(value[1] || 0)}</span>
      </div>
    </div>
  );
}

function FilterSections() {
  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 text-brand-gold"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
            />
          </svg>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink">
            Catégorie
          </h3>
        </div>
        <RefinementList
          attribute="category"
          classNames={{
            list: 'space-y-3',
            label:
              'flex items-center gap-3 text-sm text-brand-ink/60 hover:text-brand-ink cursor-pointer group transition-colors',
            checkbox:
              'rounded-sm border-brand-gold/30 text-brand-gold focus:ring-brand-gold focus:ring-offset-0 w-4 h-4 transition-all group-hover:border-brand-gold',
            count: 'text-[9px] font-bold tracking-wider text-brand-ink/30 ml-auto',
            selectedItem: 'font-bold text-brand-ink',
          }}
        />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 text-brand-gold"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink">Genre</h3>
        </div>
        <RefinementList
          attribute="gender"
          classNames={{
            list: 'space-y-3',
            label:
              'flex items-center gap-3 text-sm text-brand-ink/60 hover:text-brand-ink cursor-pointer group transition-colors',
            checkbox:
              'rounded-sm border-brand-gold/30 text-brand-gold focus:ring-brand-gold focus:ring-offset-0 w-4 h-4 transition-all group-hover:border-brand-gold',
            count: 'text-[9px] font-bold tracking-wider text-brand-ink/30 ml-auto',
            selectedItem: 'font-bold text-brand-ink',
          }}
          transformItems={(items) =>
            items.map((item) => ({
              ...item,
              label:
                item.label === 'HOMME'
                  ? 'Homme'
                  : item.label === 'FEMME'
                    ? 'Femme'
                    : item.label === 'UNISEXE'
                      ? 'Unisexe'
                      : item.label,
            }))
          }
        />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 text-brand-gold"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-1.81.688l1.15 5.071c.11.48-.385.89-1.011.609l-4.483-2.024a.564.564 0 00-.54 0l-4.483 2.024c-.626.28-1.12-.13-1.011-.609l1.15-5.071a.563.563 0 00-1.81-.688l-4.204-3.602c-.38-.325-.178-.948.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink">
            Maison & Créateur
          </h3>
        </div>
        <RefinementList
          attribute="brand"
          limit={5}
          showMore={true}
          translations={{
            showMoreButtonText({ isShowingMore }) {
              return isShowingMore ? '— Réduire' : '+ Plus de maisons';
            },
          }}
          classNames={{
            list: 'space-y-3',
            label:
              'flex items-center gap-3 text-sm text-brand-ink/60 hover:text-brand-ink cursor-pointer group transition-colors',
            checkbox:
              'rounded-sm border-brand-gold/30 text-brand-gold focus:ring-brand-gold focus:ring-offset-0 w-4 h-4 transition-all group-hover:border-brand-gold',
            count: 'text-[9px] font-bold tracking-wider text-brand-ink/30 ml-auto',
            selectedItem: 'font-bold text-brand-ink',
            showMore:
              'mt-5 text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:text-brand-ink transition-colors',
          }}
        />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 text-brand-gold"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink">Prix</h3>
        </div>
        <RangeSlider attribute="priceCents" />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 text-brand-gold"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11.25l1.5 1.5.75-.75V8.758l2.276-.61a3 3 0 10-3.675-3.675l-.61 2.277H12l-.75.75 1.5 1.5M15 11.25l-8.47 8.47c-.34.34-.8.53-1.28.53s-.94.19-1.28.53l-.97.97-.75-.75.97-.97c.34-.34.53-.8.53-1.28s.19-.94.53-1.28L12.75 9M15 11.25L12.75 9"
            />
          </svg>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink">
            Intensité
          </h3>
        </div>
        <RefinementList
          attribute="concentration"
          classNames={{
            list: 'flex flex-wrap gap-2',
            item: 'relative',
            label:
              'flex items-center justify-center text-[11px] font-bold uppercase tracking-wider text-brand-ink/50 hover:text-brand-ink cursor-pointer group px-3 py-1.5 rounded-full border border-brand-ink/10 transition-all hover:border-brand-gold/40',
            checkbox: 'hidden',
            selectedItem: '!text-brand-ink bg-brand-gold/10 border-brand-gold/50',
            count: 'hidden',
          }}
          transformItems={(items) =>
            items.map((item) => ({
              ...item,
              label: item.label
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase()),
            }))
          }
        />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 text-brand-gold"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
            />
          </svg>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink">
            Famille Olfactive
          </h3>
        </div>
        <RefinementList
          attribute="family"
          classNames={{
            list: 'space-y-3',
            label:
              'flex items-center gap-3 text-sm text-brand-ink/60 hover:text-brand-ink cursor-pointer group transition-colors',
            checkbox:
              'rounded-sm border-brand-gold/30 text-brand-gold focus:ring-brand-gold focus:ring-offset-0 w-4 h-4 transition-all group-hover:border-brand-gold',
            count: 'text-[9px] font-bold tracking-wider text-brand-ink/30 ml-auto',
            selectedItem: 'font-bold text-brand-ink',
          }}
        />
      </section>
    </div>
  );
}

export function AlgoliaProductList() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const searchParams = useSearchParams();
  const quizIds = searchParams.get('quiz_ids');

  const filters = quizIds
    ? quizIds
        .split(',')
        .filter((id) => id.trim())
        .map((id) => `id:${id}`)
        .join(' OR ')
    : '';

  // Si on a des IDs mais que le filtrage échoue (ex: mauvaise config Algolia),
  // on veut quand même savoir qu'on est en mode Quiz
  const isQuizMode = !!quizIds;

  if (!searchClient) {
    return <div className="py-20 text-center">Config Algolia manquante.</div>;
  }

  return (
    <InstantSearch searchClient={searchClient} indexName="products">
      <Configure
        hitsPerPage={isQuizMode ? 4 : 12}
        filters={filters}
        analytics={true}
        analyticsTags={isQuizMode ? ['quiz-recommendation'] : []}
      />

      <Suspense>
        <SearchFocus />
      </Suspense>

      {/* Mobile Filter Button */}
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-2 rounded-full border border-brand-ink/10 bg-white px-5 py-2.5 text-sm font-bold text-brand-ink shadow-sm"
        >
          <SlidersHorizontal size={16} className="text-brand-gold" />
          Filtrer
        </button>
        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">
          {/* We could add hit count here */}
        </div>
      </div>

      <div className="flex flex-col gap-12 lg:flex-row">
        {/* Mobile Filters Drawer */}
        <AnimatePresence>
          {showMobileFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileFilters(false)}
                className="fixed inset-0 z-[100] bg-brand-ink/40 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-[110] w-full max-w-xs bg-brand-ivory p-6 shadow-2xl lg:hidden overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-brand-ink">
                    Filtres
                  </h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 text-brand-ink"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-10 pb-10">
                  <div className="border-b border-brand-gold/10 pb-4">
                    <ClearRefinements
                      translations={{ resetButtonText: 'Tout effacer' }}
                      classNames={{
                        button:
                          'text-[10px] uppercase tracking-tighter text-brand-gold hover:text-brand-ink transition-colors font-bold',
                      }}
                    />
                  </div>
                  {/* Reuse the filter components */}
                  <FilterSections />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Filters Sidebar */}
        <aside className="hidden lg:block shrink-0 w-64">
          <div className="sticky top-28 space-y-10">
            <div className="flex items-center justify-between border-b border-brand-gold/10 pb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-brand-ink">
                Filtres
              </h2>
              <ClearRefinements
                translations={{ resetButtonText: 'Effacer' }}
                classNames={{
                  button:
                    'text-[10px] uppercase tracking-tighter text-brand-gold hover:text-brand-ink transition-colors font-bold',
                }}
              />
            </div>
            <FilterSections />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-10">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-brand-gold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <SearchBox
              placeholder="Rechercher par nom, marque, notes..."
              classNames={{
                root: 'w-full',
                form: 'relative',
                input:
                  'w-full rounded-full border border-brand-gold/30 bg-white/50 backdrop-blur-md py-4 pl-14 pr-6 text-sm text-brand-ink shadow-sm transition-all focus:border-brand-gold focus:bg-white focus:ring-1 focus:ring-brand-gold/50 placeholder:text-brand-ink/30',
                submit: 'hidden',
                reset:
                  'absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-brand-gold/10 rounded-full transition-colors text-brand-ink/40 hover:text-brand-ink',
                loadingIndicator: 'hidden',
              }}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <CurrentRefinements
                classNames={{
                  list: 'flex flex-wrap gap-2',
                  item: 'flex items-center gap-2 bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full border border-brand-gold/20',
                  label: 'hidden',
                  category: 'hidden',
                  delete: 'hover:text-brand-ink transition-colors ml-1',
                }}
              />
            </div>
          </div>

          <EmptyState isQuizMode={isQuizMode} />

          <Hits
            hitComponent={HitAdapter}
            classNames={{
              list: 'grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 xl:grid-cols-4',
            }}
          />

          <div className="mt-20 flex justify-center pb-20 border-t border-brand-gold/10 pt-10">
            <Pagination
              translations={{
                previousPageItemText: 'Précédent',
                nextPageItemText: 'Suivant',
              }}
              classNames={{
                list: 'flex items-center gap-8',
                item: 'list-none',
                link: 'text-sm font-medium text-brand-ink/40 transition-all hover:text-brand-gold',
                selectedItem:
                  '!text-brand-ink font-bold relative after:content-[""] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-brand-gold',
                disabledItem: 'opacity-0 pointer-events-none',
                nextPageItem: 'text-xs uppercase tracking-widest font-bold text-brand-gold',
                previousPageItem: 'text-xs uppercase tracking-widest font-bold text-brand-gold',
                firstPageItem: 'hidden',
                lastPageItem: 'hidden',
              }}
            />
          </div>
        </div>
      </div>
    </InstantSearch>
  );
}
