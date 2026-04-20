export type Currency = 'EUR' | 'USD' | 'XOF';
export type Role = 'CUSTOMER' | 'ADMIN';
export type Gender = 'HOMME' | 'FEMME' | 'UNISEXE';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path: string;
}

export interface Paginated<T> {
  data: T[];
  nextCursor: string | null;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  id: string;
  slug: string;
  name: string;
}

export interface ProductCardImage {
  url: string;
  alt: string | null;
}

export interface ProductDetailImage extends ProductCardImage {
  id: string;
  position: number;
  isMain: boolean;
}

export interface ProductVariant {
  id: string;
  sizeMl: number;
  priceCents: number;
  stock: number;
  sku: string;
}

export interface ProductCard {
  id: string;
  slug: string;
  sku: string;
  brand: string;
  name: string;
  priceCents: number;
  currency: string;
  gender: Gender;
  stockStatus: StockStatus;
  stock: number;
  isFeatured: boolean;
  images: ProductCardImage[];
  category: CategorySummary;
}

export interface ProductDetail extends Omit<ProductCard, 'images'> {
  description: string;
  storyTelling: string | null;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  lowStockThreshold: number;
  createdAt: string;
  images: ProductDetailImage[];
  variants: ProductVariant[];
}
