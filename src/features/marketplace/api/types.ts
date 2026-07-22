/**
 * DTOs de marketplace (docs/API_CONTRACT.md, sección 3). Espejo 1:1 del
 * contrato — el backend está fijado, esta app se adapta a él.
 */

export type BusinessStatus = 'PENDING' | 'ACTIVE' | 'HIDDEN';

export type Business = {
  id: string;
  ownerId: string;
  platformCategoryId: string;
  name: string;
  logoUrl: string | null;
  status: BusinessStatus;
  isOpen: boolean;
  deliveryFeeCents: number;
  minOrderCents: number;
  prepTimeMinutes: number;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  updatedAt: string;
  avgRating: number | null;
  reviewCount: number;
};

export type VariantOption = {
  id: string;
  name: string;
  priceDeltaCents: number;
  stock: number;
  isActive: boolean;
};

export type VariantGroup = {
  id: string;
  name: string;
  sortOrder: number;
  options: VariantOption[];
};

export type Product = {
  id: string;
  businessId: string;
  catalogCategoryId: string | null;
  name: string;
  description: string | null;
  photoUrl: string | null;
  priceCents: number;
  stock: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variantGroups: VariantGroup[];
};

export type PlatformCategory = {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
};
