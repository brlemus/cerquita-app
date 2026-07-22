import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';

import { getAuthMe } from '../api/getAuthMe';
import { shouldRetryAuthMe } from './authMeRetryPolicy';

export function useAuthMe() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getAuthMe,
    enabled: isSignedIn,
    retry: shouldRetryAuthMe,
  });
}
