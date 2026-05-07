import type { ProductDetail } from '@ecommerce/shared-types';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/components/json-ld';
import { WishlistButton } from '@/components/wishlist-button';
import { serverApi } from '@/lib/api';

import { ProductCard } from '../../_components/product-card';
import { OlfactoryNotes } from '../_components/olfactory-notes';
import { ProductActions } from '../_components/product-actions';
import { ProductGallery } from '../_components/product-gallery';
import { ProductReviews } from '../_components/product-reviews';

export const revalidate = 3600;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002';

  try {
    const p = await serverApi.products.bySlug(slug);
    const title = `${p.brand} ${p.name}`;
    const canonicalUrl = `${siteUrl}/produits/${p.slug}`;
    const ogImage = p.images.find((i) => i.isMain)?.url ?? p.images[0]?.url;

    return {
      title,
      description: p.description,
      alternates: {
        canonical: canonicalUrl,
        languages: {
          'fr-FR': canonicalUrl,
          'x-default': canonicalUrl,
        },
      },
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

const CONCENTRATION_LABEL: Record<string, string> = {
  EAU_FRAICHE: 'Eau Fraîche',
  EAU_DE_COLOGNE: 'Eau de Cologne',
  EAU_DE_TOILETTE: 'Eau de Toilette',
  EAU_DE_PARFUM: 'Eau de Parfum',
  PARFUM: 'Parfum',
  EXTRAIT_DE_PARFUM: 'Extrait de Parfum',
};

const FAMILY_LABEL: Record<string, string> = {
  HESPERIDE: 'Hespéridé',
  FLORAL: 'Floral',
  BOISE: 'Boisé',
  ORIENTAL: 'Oriental',
  AMBRE: 'Ambré',
  FOUGERE: 'Fougère',
  CHYPRE: 'Chypré',
  CUIR: 'Cuir',
};

export default async function ProductPage({ params }: Props): Promise<JSX.Element> {
  const { slug } = await params;
  const product = await serverApi.products.bySlug(slug).catch(() => null);
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
      price:
        product.currency === 'XOF'
          ? product.priceCents.toString()
          : (product.priceCents / 100).toFixed(2),
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
                  {product.concentration && ` · ${CONCENTRATION_LABEL[product.concentration]}`}
                  {product.family && ` · ${FAMILY_LABEL[product.family]}`}
                </p>
                {product.sizeMl && product.variants.length === 0 && (
                  <p className="mt-2 text-sm font-medium text-brand-ink/60">
                    Contenance : {product.sizeMl} ml
                  </p>
                )}
              </div>
              <WishlistButton
                productId={product.id}
                className="mt-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-brand-ink/10 transition hover:border-brand-gold hover:bg-brand-ivory"
              />
            </div>
          </div>

          <ProductActions product={product as unknown as ProductDetail} />

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

        <ProductReviews productId={product.id} />
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
