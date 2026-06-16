export interface AuthTokenState {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface UseAuthTokenResult {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

/**
 * Thin wrapper that derives `isAuthenticated` from a token state object.
 * Pass in the relevant slice of your Zustand store (or any state).
 *
 * @example
 * // Inside a component:
 * const { accessToken, refreshToken } = useAuthStore();
 * const { isAuthenticated } = useAuthToken({ accessToken, refreshToken });
 */
export function useAuthToken(state: AuthTokenState): UseAuthTokenResult {
  return {
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    isAuthenticated: !!state.accessToken,
  };
}
