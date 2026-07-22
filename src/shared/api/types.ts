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
