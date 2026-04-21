import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/components/json-ld';
import { WishlistButton } from '@/components/wishlist-button';
import { serverApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

import { ProductCard } from '../../_components/product-card';
import { AddToCartButton } from '../_components/add-to-cart-button';
import { OlfactoryNotes } from '../_components/olfactory-notes';
import { ProductGallery } from '../_components/product-gallery';

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002';

  try {
    const p = await serverApi.products.bySlug(params.slug);
    const title = `${p.brand} ${p.name}`;
    const canonicalUrl = `${siteUrl}/produits/${p.slug}`;
    const ogImage = p.images.find((i) => i.isMain)?.url ?? p.images[0]?.url;

    return {
      title,
      description: p.description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description: p.description,
        url: canonicalUrl,
        siteName: 'Maison Parfum',
        type: 'website',
        ...(ogImage && {
          images: [{ url: ogImage, width: 800, height: 800, alt: title }],
        }),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: p.description,
        ...(ogImage && { images: [ogImage] }),
      },
    };
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
  // Sort: main image first, then by position
  const galleryImages = [
    ...product.images.filter((i) => i.isMain),
    ...product.images.filter((i) => !i.isMain),
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002';
  const productUrl = `${siteUrl}/produits/${product.slug}`;

  const availability =
    product.stockStatus === 'OUT_OF_STOCK'
      ? 'https://schema.org/OutOfStock'
      : 'https://schema.org/InStock';

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.name}`,
    description: product.description,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand },
    ...(mainImage && { image: mainImage.url }),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: product.currency,
      price: (product.priceCents / 100).toFixed(2),
      availability,
      seller: { '@type': 'Organization', name: 'Maison Parfum' },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Catalogue', item: `${siteUrl}/produits` },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.category.name,
        item: `${siteUrl}/produits?category=${product.category.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: `${product.brand} ${product.name}`,
        item: productUrl,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
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
        <div className="lg:sticky lg:top-8 lg:self-start">
          <ProductGallery images={galleryImages} productName={`${product.brand} ${product.name}`} />
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-brand-ink/40">
                  {product.brand}
                </p>
                <h1 className="mt-1 font-serif text-4xl text-brand-ink">{product.name}</h1>
                <p className="mt-1 text-sm text-brand-ink/40">
                  {GENDER_LABEL[product.gender] ?? product.gender}
                </p>
              </div>
              <WishlistButton
                productId={product.id}
                className="mt-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-brand-ink/10 transition hover:border-brand-gold hover:bg-brand-ivory"
              />
            </div>
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
        </div>
      </div>

      {/* Olfactory pyramid + storytelling — full width below the grid */}
      <div className="mt-16">
        <OlfactoryNotes
          topNotes={product.topNotes}
          heartNotes={product.heartNotes}
          baseNotes={product.baseNotes}
          storyTelling={product.storyTelling}
        />
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
