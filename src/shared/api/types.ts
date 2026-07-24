/**
 * Tipos transversales del contrato (docs/API_CONTRACT.md). Los DTOs propios
 * de cada feature (marketplace, orders, etc.) viven en su propia carpeta.
 */

export type PaginatedResponse<T> = {
  data: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

export type CursorQuery = {
  cursor?: string;
  limit?: number;
};

export type DomainErrorCode = 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION' | 'FORBIDDEN';

/**
 * Catálogo estable de `details.reason` en los 409 de pedidos y reseñas
 * (docs/API_CONTRACT.md, `cerquita-api` PR #16, 2026-07-24). Discriminador
 * preferido sobre `message`/forma de `details`.
 */
export type OrderConflictReason =
  | 'BUSINESS_NOT_ACCEPTING_ORDERS'
  | 'BELOW_MINIMUM_ORDER'
  | 'PRODUCT_NOT_ACTIVE'
  | 'VARIANT_OPTION_NOT_ACTIVE'
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_STATUS_TRANSITION'
  | 'STATUS_CHANGED_CONCURRENTLY'
  | 'ORDER_NOT_DELIVERED'
  | 'REVIEW_ALREADY_EXISTS';

/** Errores de dominio: code, sin statusCode en el body. */
export type DomainErrorBody = {
  code: DomainErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

/** Excepciones HTTP de Nest (guards, ValidationPipe, throttler). */
export type HttpErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export type UserRole = 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'EMPLOYEE' | 'CUSTOMER';

/** GET /auth/me — alta JIT del usuario autenticado (docs/API_CONTRACT.md, sección Auth). */
export type AuthMeResponse = {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  businessId: string | null;
};
