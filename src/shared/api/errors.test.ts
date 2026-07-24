import { mapError } from './errors';

describe('mapError', () => {
  it('maps 401 to unauthorized', () => {
    expect(mapError(401, { statusCode: 401, message: 'Unauthorized' })).toEqual({
      kind: 'unauthorized',
      status: 401,
      message: 'Unauthorized',
    });
  });

  it('maps 403 "User is suspended" to suspended', () => {
    expect(mapError(403, { statusCode: 403, message: 'User is suspended' })).toEqual({
      kind: 'suspended',
      status: 403,
      message: 'User is suspended',
    });
  });

  it('maps other 403 domain errors to forbidden', () => {
    expect(
      mapError(403, { code: 'FORBIDDEN', message: 'Actor not allowed for this transition' }),
    ).toEqual({
      kind: 'forbidden',
      status: 403,
      message: 'Actor not allowed for this transition',
    });
  });

  it('maps 404 to notFound', () => {
    expect(mapError(404, { code: 'NOT_FOUND', message: 'Business not found' })).toEqual({
      kind: 'notFound',
      status: 404,
      message: 'Business not found',
    });
  });

  it('maps 409 re-register-by-suspended-admin to reRegisterBlocked', () => {
    const body = {
      code: 'CONFLICT',
      message:
        'Cannot re-register: the existing account for this email was suspended by an administrator',
      details: { email: 'a@b.com' },
    };
    expect(mapError(409, body)).toEqual({
      kind: 'reRegisterBlocked',
      status: 409,
      message: body.message,
      details: { email: 'a@b.com' },
    });
  });

  it('maps 409 re-register-active-account to reRegisterBlocked', () => {
    const body = {
      code: 'CONFLICT',
      message: 'A user with email a@b.com already exists',
      details: { email: 'a@b.com' },
    };
    expect(mapError(409, body).kind).toBe('reRegisterBlocked');
  });

  it('maps other 409 domain conflicts (order transition) to conflict', () => {
    const body = { code: 'CONFLICT', message: 'Order is no longer PENDIENTE' };
    expect(mapError(409, body)).toEqual({
      kind: 'conflict',
      status: 409,
      code: 'CONFLICT',
      message: 'Order is no longer PENDIENTE',
      details: undefined,
    });
  });

  it('un 409 con reason reconocido nunca es reRegisterBlocked, aunque el message matchee el regex de re-registro', () => {
    const body = {
      code: 'CONFLICT',
      message: 'A user with email a@b.com already exists',
      details: { reason: 'REVIEW_ALREADY_EXISTS', orderId: 'order-1' },
    };
    expect(mapError(409, body).kind).toBe('conflict');
  });

  it('maps 400 with array message (ValidationPipe) to validation', () => {
    const body = { statusCode: 400, message: ['line should not be empty'], error: 'Bad Request' };
    expect(mapError(400, body)).toEqual({
      kind: 'validation',
      status: 400,
      message: ['line should not be empty'],
    });
  });

  it('maps 400 domain VALIDATION with string message to validation', () => {
    expect(mapError(400, { code: 'VALIDATION', message: 'rating must be 1-5' })).toEqual({
      kind: 'validation',
      status: 400,
      message: 'rating must be 1-5',
    });
  });

  it('maps 429 to rateLimited', () => {
    expect(mapError(429, { statusCode: 429, message: 'Too Many Requests' })).toEqual({
      kind: 'rateLimited',
      status: 429,
      message: 'Too Many Requests',
    });
  });

  it('maps 5xx to server', () => {
    expect(mapError(500, undefined)).toEqual({
      kind: 'server',
      status: 500,
      message: 'Unexpected error',
    });
  });

  it('maps unrecognized statuses to unknown', () => {
    expect(mapError(418, { message: "I'm a teapot" })).toEqual({
      kind: 'unknown',
      status: 418,
      message: "I'm a teapot",
    });
  });
});
