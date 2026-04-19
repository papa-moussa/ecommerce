/**
 * Shared types between Next.js (web) and NestJS (api).
 * Populated as DTOs land in Sprint 1+.
 */

export type Currency = 'EUR' | 'USD' | 'XOF';

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
  total?: number;
}
