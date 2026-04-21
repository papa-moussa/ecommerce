import type { MetadataRoute } from 'next';

export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002';

interface CategoryEntry {
  slug: string;
  updatedAt?: string;
}

interface ProductEntry {
  slug: string;
  updatedAt?: string;
}

interface PaginatedProducts {
  data: ProductEntry[];
  nextCursor: string | null;
}

async function fetchAllProductSlugs(): Promise<ProductEntry[]> {
  const results: ProductEntry[] = [];
  let cursor: string | null = null;

  do {
    const qs = cursor ? `?limit=100&cursor=${cursor}&isActive=true` : '?limit=100&isActive=true';
    try {
      const res = await fetch(`${BASE}/products${qs}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const page: PaginatedProducts = await res.json();
      results.push(...page.data);
      cursor = page.nextCursor;
    } catch {
      break;
    }
  } while (cursor);

  return results;
}

async function fetchCategories(): Promise<CategoryEntry[]> {
  try {
    const res = await fetch(`${BASE}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([fetchCategories(), fetchAllProductSlugs()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE}/produits`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE}/produits?category=${c.slug}`,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE}/produits/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
