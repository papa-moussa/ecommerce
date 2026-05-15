import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { algoliasearch } from 'algoliasearch';

import { type AppConfig } from '../config/configuration';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: any = null;
  private readonly indexName = 'products';

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  onModuleInit() {
    const appId = this.config.get('ALGOLIA_APP_ID', { infer: true });
    const apiKey = this.config.get('ALGOLIA_API_KEY', { infer: true });

    if (appId && apiKey) {
      this.client = algoliasearch(appId, apiKey);
      this.logger.log('Algolia client initialized');
      this.setIndexSettings().catch((err) =>
        this.logger.error('Failed to set Algolia settings', err),
      );
    } else {
      this.logger.warn('Algolia credentials missing. Search indexing disabled.');
    }
  }

  private async setIndexSettings() {
    if (!this.client) return;
    try {
      await this.client.setSettings({
        indexName: this.indexName,
        indexSettings: {
          attributesForFaceting: [
            'searchable(category)',
            'searchable(brand)',
            'searchable(gender)',
            'searchable(family)',
            'priceCents', // Allows range filtering
            'concentration',
            'stockStatus',
          ],
          searchableAttributes: [
            'name',
            'brand',
            'category',
            'description',
            'family',
            'concentration',
            'tags',
          ],
        },
      });
      this.logger.log('Algolia index settings updated');
    } catch (err) {
      this.logger.error('Error setting Algolia index settings', err);
    }
  }

  async saveProduct(product: any) {
    if (!this.client) return;

    try {
      const record = {
        objectID: product.id,
        id: product.id, // Doublon pour faciliter le filtrage/faceting
        name: product.name,
        brand: product.brand,
        description: product.description,
        slug: product.slug,
        priceCents: product.priceCents,
        currency: product.currency,
        imageUrl: product.images?.[0]?.url || '',
        category: product.category?.name || '',
        gender: product.gender,
        stockStatus: product.stockStatus,
        concentration: product.concentration,
        family: product.family,
        sizeMl: product.sizeMl,
        occasions: product.occasions || [],
        rating: product.rating || 0,
        tags: product.tags || [],
        createdAt: product.createdAt.getTime(),
        variants: (product.variants || []).map((v: any) => ({
          id: v.id,
          sizeMl: v.sizeMl,
          priceCents: v.priceCents,
          stock: v.stock,
        })),
      };

      await this.client.saveObject({
        indexName: this.indexName,
        body: record,
      });
      this.logger.debug(`Product ${product.id} indexed in Algolia`);
    } catch (err) {
      this.logger.error(`Failed to index product ${product.id}`, err);
    }
  }

  async deleteProduct(productId: string) {
    if (!this.client) return;

    try {
      await this.client.deleteObject({
        indexName: this.indexName,
        objectID: productId,
      });
      this.logger.debug(`Product ${productId} deleted from Algolia`);
    } catch (err) {
      this.logger.error(`Failed to delete product ${productId}`, err);
    }
  }

  async syncAllProducts(products: any[]) {
    if (!this.client) return;

    const objects = products.map((p) => ({
      objectID: p.id,
      id: p.id,
      name: p.name,
      brand: p.brand,
      description: p.description,
      slug: p.slug,
      priceCents: p.priceCents,
      currency: p.currency,
      imageUrl: p.images?.[0]?.url || '',
      category: p.category?.name || '',
      gender: p.gender,
      stockStatus: p.stockStatus,
      concentration: p.concentration,
      family: p.family,
      sizeMl: p.sizeMl,
      occasions: p.occasions || [],
      rating: p.rating || 0,
      tags: p.tags || [],
      createdAt: p.createdAt.getTime(),
      variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        sizeMl: v.sizeMl,
        priceCents: v.priceCents,
        stock: v.stock,
      })),
    }));

    try {
      await this.client.saveObjects({
        indexName: this.indexName,
        objects,
      });
      this.logger.log(`Synced ${objects.length} products to Algolia`);
    } catch (err) {
      this.logger.error('Failed to sync all products', err);
    }
  }

  // HIGH-05 (Audit-2): allowlists prevent Algolia filter injection
  private static readonly VALID_FAMILIES = new Set([
    'HESPERIDE',
    'FLORAL',
    'BOISE',
    'ORIENTAL',
    'AMBRE',
    'FOUGERE',
    'CHYPRE',
    'CUIR',
  ]);
  private static readonly VALID_OCCASIONS = new Set([
    'DAILY',
    'EVENING',
    'SPECIAL',
    'SPORT',
    'OFFICE',
  ]);

  async recommend(answers: Record<string, unknown>) {
    if (!this.client) return [];

    const filters: string[] = [];

    const family = typeof answers.family === 'string' ? answers.family.toUpperCase() : null;
    const rawOccasion = answers.occasion ?? answers.occasions;
    const occasion = typeof rawOccasion === 'string' ? rawOccasion.toUpperCase() : null;

    // Validate against allowlists before building Algolia filter string
    if (family && SearchService.VALID_FAMILIES.has(family)) {
      filters.push(`family:${family}`);
    } else if (family) {
      this.logger.warn(`[HIGH-05] Rejected invalid family value: "${family}"`);
    }
    if (occasion && SearchService.VALID_OCCASIONS.has(occasion)) {
      filters.push(`occasions:${occasion}`);
    } else if (occasion) {
      this.logger.warn(`[HIGH-05] Rejected invalid occasion value: "${occasion}"`);
    }

    // Pour l'intensité, on peut soit filtrer sur la concentration si on a une correspondance,
    // soit utiliser des tags ou d'autres attributs.
    // Ici on va rester simple et utiliser family et occasion comme filtres stricts,
    // et l'intensité comme préférence si possible ou juste l'ignorer pour l'instant si pas de mapping.

    const filtersStr = filters.join(' AND ');
    this.logger.debug(`Recommending with filters: ${filtersStr}`);

    try {
      const { results } = await this.client.search({
        requests: [
          {
            indexName: this.indexName,
            query: '',
            filters: filtersStr,
            hitsPerPage: 6, // On en prend un peu plus pour varier
          },
        ],
      });

      let hits = (results[0] as any).hits;

      // Si pas de résultats avec les filtres stricts, on bascule sur de la recherche floue
      if (hits.length === 0 && filters.length > 0) {
        this.logger.log('No exact matches found, falling back to optional filters');
        const fallbackResults = await this.client.search({
          requests: [
            {
              indexName: this.indexName,
              query: '',
              optionalFilters: filters,
              hitsPerPage: 6,
            },
          ],
        });
        hits = (fallbackResults.results[0] as any).hits;
      }

      return hits;
    } catch (err: any) {
      this.logger.error(`Failed to get recommendations: ${err.message}`);
      return [];
    }
  }
}
