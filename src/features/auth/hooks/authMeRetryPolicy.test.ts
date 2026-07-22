import { ApiRequestError } from '@/shared/api';

import { shouldRetryAuthMe } from './authMeRetryPolicy';

describe('shouldRetryAuthMe', () => {
  it('does not retry account errors from the contract (401/403/409)', () => {
    expect(
      shouldRetryAuthMe(0, new ApiRequestError({ kind: 'unauthorized', status: 401, message: '' })),
    ).toBe(false);
    expect(
      shouldRetryAuthMe(0, new ApiRequestError({ kind: 'suspended', status: 403, message: '' })),
    ).toBe(false);
    expect(
      shouldRetryAuthMe(
        0,
        new ApiRequestError({ kind: 'reRegisterBlocked', status: 409, message: '' }),
      ),
    ).toBe(false);
    expect(
      shouldRetryAuthMe(0, new ApiRequestError({ kind: 'conflict', status: 409, message: '' })),
    ).toBe(false);
  });

  it('retries transient failures up to 2 times', () => {
    const networkError = new ApiRequestError({ kind: 'network', message: '' });

    expect(shouldRetryAuthMe(0, networkError)).toBe(true);
    expect(shouldRetryAuthMe(1, networkError)).toBe(true);
    expect(shouldRetryAuthMe(2, networkError)).toBe(false);
  });

  it('retries 5xx and rate limit errors', () => {
    expect(
      shouldRetryAuthMe(0, new ApiRequestError({ kind: 'server', status: 500, message: '' })),
    ).toBe(true);
    expect(
      shouldRetryAuthMe(0, new ApiRequestError({ kind: 'rateLimited', status: 429, message: '' })),
    ).toBe(true);
  });

  it('does not retry unrecognized errors', () => {
    expect(shouldRetryAuthMe(0, new Error('boom'))).toBe(false);
  });
});
