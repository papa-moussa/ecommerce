import type { ProductCard as ProductCardType } from '@ecommerce/shared-types';
import Link from 'next/link';

import { ProductCard } from '../product-card';

export function FeaturedSelection({ products }: { products: ProductCardType[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="bg-brand-ivory py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold mb-4 block">
              Notre curation
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-brand-ink">
              Éditions Rares & Signatures
            </h2>
          </div>
          <Link
            href="/produits"
            className="group flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-ink/60 hover:text-brand-ink transition-colors pb-2 border-b border-brand-ink/20 hover:border-brand-ink"
          >
            Tout explorer
            <span className="w-4 h-px bg-current transition-all group-hover:w-8"></span>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
