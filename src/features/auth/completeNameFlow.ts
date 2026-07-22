/**
 * Orquesta el fix del claim `name` vacío (usuario de Apple que no comparte
 * su nombre): guarda el nombre en Clerk, fuerza un token fresco (para que
 * el claim `name` del session token quede al día) y recién ahí reintenta
 * `/auth/me` — en ese orden estricto, para que el reintento viaje con el
 * token nuevo y no con uno cacheado. Ver docs/phases/phase-1.5-social-login.md.
 */

type UpdatableUser = {
  update: (params: { firstName: string }) => Promise<unknown>;
};

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

export async function saveNameAndRefreshToken(
  user: UpdatableUser,
  getToken: GetToken,
  refetch: () => Promise<unknown>,
  firstName: string,
): Promise<void> {
  await user.update({ firstName });
  await getToken({ skipCache: true });
  await refetch();
}
