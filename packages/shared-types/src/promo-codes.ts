export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface PromoCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  minOrderCents: number | null;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  applicableProductIds: string[];
  applicableCategoryIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplyPromoRequest {
  code: string;
}

export interface ApplyPromoResponse {
  valid: boolean;
  code: string;
  type: DiscountType;
  value: number;
  discountCents: number;
  message?: string;
}
