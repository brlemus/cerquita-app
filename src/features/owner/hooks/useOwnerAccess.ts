import { useAuthMe } from '@/features/auth/hooks/useAuthMe';

export type OwnerAccess = {
  hasBusiness: boolean;
  businessId: string | null;
};

/**
 * `hasBusiness` exige rol Y negocio a la vez (Decisión 1,
 * docs/phases/phase-10-owner-foundations.md) -- el backend permite que se
 * desincronicen (`PATCH /platform/users/:id/role` no valida coherencia), y
 * un estado a medias debe degradar a "cliente normal", no a una pantalla
 * rota.
 */
export function useOwnerAccess(): OwnerAccess {
  const { data } = useAuthMe();

  const hasBusiness = data?.role === 'BUSINESS_OWNER' && data.businessId !== null;

  return {
    hasBusiness,
    businessId: hasBusiness ? (data?.businessId ?? null) : null,
  };
}
