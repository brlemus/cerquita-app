import { getAuthMe } from './getAuthMe';

function mockFetchOnce(status: number, body: unknown) {
  const text = body === undefined ? '' : JSON.stringify(body);
  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => text,
  } as unknown as Response);
}

describe('getAuthMe', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the parsed AuthMeResponse on success', async () => {
    mockFetchOnce(200, {
      id: '1',
      clerkId: 'clerk_1',
      name: 'Ana',
      email: 'ana@cerquita.app',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      businessId: null,
    });

    await expect(getAuthMe()).resolves.toMatchObject({ id: '1', role: 'CUSTOMER' });
  });

  it('throws if the response has no body (unexpected 304)', async () => {
    mockFetchOnce(304, undefined);

    await expect(getAuthMe()).rejects.toThrow('GET /auth/me returned no body');
  });
});
