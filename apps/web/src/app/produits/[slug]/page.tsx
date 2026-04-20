import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { serverApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

import { ProductCard } from '../../_components/product-card';
import { AddToCartButton } from '../_components/add-to-cart-button';

export const revalidate = 3600;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  try {
    const { data } = await serverApi.products.list({ limit: '50' });
    return data.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const p = await serverApi.products.bySlug(params.slug);
    return { title: `${p.brand} ${p.name}`, description: p.description };
  } catch {
    return { title: 'Produit introuvable' };
  }
}

const GENDER_LABEL: Record<string, string> = {
  FEMME: 'Femme',
  HOMME: 'Homme',
  UNISEXE: 'Unisexe',
};

export default async function ProductPage({ params }: Props): Promise<JSX.Element> {
  const product = await serverApi.products.bySlug(params.slug).catch(() => null);
  if (!product) notFound();

  const related = await serverApi.products.related(product.id).catch(() => []);
  const mainImage = product.images.find((i) => i.isMain) ?? product.images[0];
  const otherImages = product.images.filter((i) => !i.isMain).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-brand-ink/40">
        <Link href="/produits" className="hover:text-brand-ink">
          Catalogue
        </Link>
        <span>/</span>
        <Link href={`/produits?category=${product.category.slug}`} className="hover:text-brand-ink">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-brand-ink/70">
          {product.brand} {product.name}
        </span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          {mainImage ? (
            <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
              <Image
                src={mainImage.url}
                alt={mainImage.alt ?? `${product.brand} ${product.name}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-xl bg-white text-brand-ink/20">
              —
            </div>
          )}
          {otherImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {otherImages.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-white">
                  <Image
                    src={img.url}
                    alt={img.alt ?? ''}
                    fill
                    sizes="(max-width: 1024px) 33vw, 17vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-ink/40">{product.brand}</p>
            <h1 className="mt-1 font-serif text-4xl text-brand-ink">{product.name}</h1>
            <p className="mt-1 text-sm text-brand-ink/40">
              {GENDER_LABEL[product.gender] ?? product.gender}
            </p>
          </div>

          <p className="text-2xl font-medium text-brand-ink">
            {formatPrice(product.priceCents, product.currency)}
          </p>

          {product.variants.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-brand-ink/40">Contenance</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    disabled={v.stock === 0}
                    className="rounded-full border border-brand-ink/20 px-4 py-1.5 text-sm transition-colors hover:border-brand-gold hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {v.sizeMl} ml — {formatPrice(v.priceCents)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.stockStatus === 'OUT_OF_STOCK' && (
            <p className="text-sm font-medium text-red-600">Ce produit est épuisé.</p>
          )}
          {product.stockStatus === 'LOW_STOCK' && (
            <p className="text-sm font-medium text-amber-600">Plus que quelques pièces.</p>
          )}

          <AddToCartButton
            productId={product.id}
            name={product.name}
            brand={product.brand}
            imageUrl={mainImage?.url}
            unitPriceCents={product.priceCents}
            stockStatus={product.stockStatus}
          />

          <div className="border-t border-brand-ink/10 pt-6">
            <p className="leading-relaxed text-brand-ink/70">{product.description}</p>
          </div>

          {product.storyTelling && (
            <div className="border-t border-brand-ink/10 pt-6">
              <h2 className="mb-2 font-serif text-lg text-brand-ink">Histoire</h2>
              <p className="text-sm leading-relaxed text-brand-ink/60">{product.storyTelling}</p>
            </div>
          )}

          {(product.topNotes.length > 0 ||
            product.heartNotes.length > 0 ||
            product.baseNotes.length > 0) && (
            <div className="border-t border-brand-ink/10 pt-6">
              <h2 className="mb-4 font-serif text-lg text-brand-ink">Notes olfactives</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {product.topNotes.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-widest text-brand-ink/40">Tête</p>
                    <ul className="space-y-1">
                      {product.topNotes.map((n) => (
                        <li key={n} className="text-brand-ink/60">
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.heartNotes.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-widest text-brand-ink/40">Cœur</p>
                    <ul className="space-y-1">
                      {product.heartNotes.map((n) => (
                        <li key={n} className="text-brand-ink/60">
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.baseNotes.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-widest text-brand-ink/40">Fond</p>
                    <ul className="space-y-1">
                      {product.baseNotes.map((n) => (
                        <li key={n} className="text-brand-ink/60">
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="mb-8 font-serif text-2xl text-brand-ink">Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
