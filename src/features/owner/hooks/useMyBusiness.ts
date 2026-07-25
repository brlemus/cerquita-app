import { useQuery } from '@tanstack/react-query';

import { getMyBusiness } from '../api/getMyBusiness';

export const MY_BUSINESS_QUERY_KEY = ['business', 'me'] as const;

/**
 * `enabled: hasBusiness` -- nunca se dispara para un customer puro. El
 * chooser no bloquea su render por esta query (Decisión 7,
 * docs/phases/phase-10-owner-foundations.md): si falla o tarda, la
 * pantalla cae a un subtítulo genérico en vez de esperar.
 */
export function useMyBusiness(hasBusiness: boolean) {
  return useQuery({
    queryKey: MY_BUSINESS_QUERY_KEY,
    queryFn: getMyBusiness,
    enabled: hasBusiness,
  });
}
