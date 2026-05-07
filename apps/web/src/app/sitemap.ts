import type { MetadataRoute } from 'next';

import { serverApi } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

  // Static routes
  const staticRoutes = ['', '/produits', '/quiz', '/recherche', '/connexion', '/inscription'].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8,
    }),
  );

  // Dynamic products
  let products: Array<{
    slug: string;
    updatedAt?: string;
    brand?: string;
    name?: string;
    priceCents?: number;
  }> = [];
  try {
    const response = await serverApi.products.list({ limit: '50' });
    products = response.data;
  } catch (e) {
    console.error('Failed to fetch products for sitemap', e);
  }

  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/produits/${product.slug}`,
    lastModified: new Date(product.updatedAt || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes];
}
