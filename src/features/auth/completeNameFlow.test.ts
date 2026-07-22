import { configureAuth, request } from '@/shared/api';

import { saveNameAndRefreshToken } from './completeNameFlow';

function mockFetchOnce(status: number, body: unknown) {
  const text = body === undefined ? '' : JSON.stringify(body);
  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => text,
  } as unknown as Response);
}

describe('saveNameAndRefreshToken', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    configureAuth(async () => undefined);
  });

  it('the /auth/me retry travels with the fresh token, not the stale cached one', async () => {
    // Simula el cache real de Clerk: getToken() plano devuelve lo cacheado;
    // getToken({skipCache:true}) refresca el cache para las próximas llamadas.
    let cachedToken = 'stale-token';
    const getToken = jest.fn(async (options?: { skipCache?: boolean }) => {
      if (options?.skipCache) {
        cachedToken = 'fresh-token';
      }
      return cachedToken;
    });
    // Mismo wiring que AuthConfigurator en app/_layout.tsx: getToken() sin opciones.
    configureAuth(() => getToken());

    mockFetchOnce(200, { id: '1' });
    const update = jest.fn().mockResolvedValue(undefined);
    const refetch = jest.fn(() => request('/auth/me'));

    await saveNameAndRefreshToken({ update }, getToken, refetch, 'Ana');

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer fresh-token');
  });

  it('calls update, then a skipCache token refresh, then refetch, in that order', async () => {
    const calls: string[] = [];
    const update = jest.fn().mockImplementation(async () => {
      calls.push('update');
    });
    const getToken = jest.fn().mockImplementation(async (options?: { skipCache?: boolean }) => {
      calls.push(options?.skipCache ? 'getToken:skipCache' : 'getToken');
      return 'token';
    });
    const refetch = jest.fn().mockImplementation(async () => {
      calls.push('refetch');
    });

    await saveNameAndRefreshToken({ update }, getToken, refetch, 'Ana');

    expect(calls).toEqual(['update', 'getToken:skipCache', 'refetch']);
    expect(update).toHaveBeenCalledWith({ firstName: 'Ana' });
  });

  it('does not call refetch if updating the name fails', async () => {
    const update = jest.fn().mockRejectedValue(new Error('network'));
    const getToken = jest.fn();
    const refetch = jest.fn();

    await expect(saveNameAndRefreshToken({ update }, getToken, refetch, 'Ana')).rejects.toThrow(
      'network',
    );

    expect(getToken).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });
});
