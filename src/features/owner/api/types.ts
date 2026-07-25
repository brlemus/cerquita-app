export type BusinessStatus = 'PENDING' | 'ACTIVE' | 'HIDDEN';

/**
 * GET /business/me -- espejo de `BusinessResponseDto`
 * (cerquita-api, business-owner.controller.ts). No confundir con `Business`
 * de `marketplace/api/types.ts`: son DTOs distintos (este trae `ownerId` y
 * `status` de owner, no el shape público del marketplace).
 */
export type MyBusiness = {
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
};
