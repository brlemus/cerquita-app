export { configureAuth, request, requestRaw, type RequestOptions } from './client';
export { ApiRequestError, mapError, type ApiError } from './errors';
export { buildQueryString, type QueryParams } from './queryString';
export type {
  AuthMeResponse,
  CursorQuery,
  DomainErrorBody,
  DomainErrorCode,
  HttpErrorBody,
  PaginatedResponse,
  UserRole,
  UserStatus,
} from './types';
