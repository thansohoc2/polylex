/**
 * HTTP Client Factory with JWT Token Management
 *
 * Provides a factory function to create Axios instances with automatic JWT token
 * management and refresh logic. When access tokens expire (401), the interceptor
 * automatically uses the refresh token to obtain a new pair and retries the request.
 *
 * @module http-client
 * @example
 * ```typescript
 * const adapter: AuthTokenAdapter = {
 *   getAccessToken: () => store.auth.accessToken,
 *   getRefreshToken: () => store.auth.refreshToken,
 *   onRefreshed: (tokens) => { store.setTokens(tokens); return true; },
 *   onAuthFailed: () => redirectToLogin(),
 * };
 *
 * const client = createApiClientWithAuth({
 *   baseURL: 'http://api.example.com/v1',
 *   auth: adapter,
 * });
 *
 * // Use client for all requests
 * const data = await client.get('/user/me');
 * ```
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Represents a pair of access + refresh tokens from the backend.
 *
 * @interface TokenPairLike
 * @property {string} accessToken - JWT access token (typically short-lived, ~15 minutes)
 * @property {string} refreshToken - JWT refresh token (typically long-lived, ~30 days)
 *
 * @example
 * ```typescript
 * const tokens: TokenPairLike = {
 *   accessToken: 'eyJhbGc...',
 *   refreshToken: 'eyJhbGc...',
 * };
 * ```
 */
export interface TokenPairLike {
  accessToken: string;
  refreshToken: string;
}

/**
 * Contract for token storage and lifecycle management.
 *
 * Implement this interface to integrate the HTTP client with your chosen storage
 * mechanism (Zustand, localStorage, React Context, Redux, etc.). The HTTP client
 * uses these methods to retrieve, update, and invalidate tokens.
 *
 * @interface AuthTokenAdapter
 *
 * @example
 * ```typescript
 * // With Zustand store
 * const adapter: AuthTokenAdapter = {
 *   getAccessToken: () => useAuthStore.getState().accessToken || null,
 *   getRefreshToken: () => useAuthStore.getState().refreshToken || null,
 *   onRefreshed: async (tokens) => {
 *     useAuthStore.setState({ ...tokens });
 *     return true;
 *   },
 *   onAuthFailed: () => {
 *     useAuthStore.setState({ accessToken: null, refreshToken: null });
 *     redirectToLogin();
 *   },
 * };
 * ```
 *
 * @example
 * ```typescript
 * // With localStorage (not recommended for sensitive tokens)
 * const adapter: AuthTokenAdapter = {
 *   getAccessToken: () => localStorage.getItem('accessToken'),
 *   getRefreshToken: () => localStorage.getItem('refreshToken'),
 *   onRefreshed: (tokens) => {
 *     localStorage.setItem('accessToken', tokens.accessToken);
 *     localStorage.setItem('refreshToken', tokens.refreshToken);
 *     return true;
 *   },
 *   onAuthFailed: () => {
 *     localStorage.removeItem('accessToken');
 *     localStorage.removeItem('refreshToken');
 *     redirectToLogin();
 *   },
 * };
 * ```
 */
export interface AuthTokenAdapter {
  /**
   * Retrieve the current access token from storage.
   *
   * @returns {string | null} The access token, or null if not available/logged out
   */
  getAccessToken: () => string | null;

  /**
   * Retrieve the current refresh token from storage.
   *
   * @returns {string | null} The refresh token, or null if not available/logged out
   */
  getRefreshToken: () => string | null;

  /**
   * Called when the HTTP client obtains a new token pair (e.g., after refresh).
   * Update your storage with the new tokens.
   *
   * @param {TokenPairLike} tokens - The new access + refresh token pair from backend
   * @returns {boolean | Promise<boolean>} true if tokens were saved successfully,
   *                                        false if failed (will trigger onAuthFailed)
   *
   * @description
   * This method is called immediately after a successful token refresh.
   * It should update your persistent storage with the new tokens. If you return false,
   * the HTTP client treats it as a storage failure and calls onAuthFailed().
   */
  onRefreshed: (tokens: TokenPairLike) => boolean | Promise<boolean>;

  /**
   * Called when authentication fails irreversibly.
   *
   * This happens when:
   * - Refresh token is invalid or expired
   * - Refresh call returns 401
   * - User account is banned/deleted
   * - Session revoked by admin
   *
   * @description
   * Clear all tokens from storage and redirect the user to login. This is the
   * only time an unauthenticated state should be entered. All other 401s are
   * handled transparently by the retry logic.
   *
   * @example
   * ```typescript
   * onAuthFailed: () => {
   *   useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
   *   window.location.href = '/login';
   * }
   * ```
   */
  onAuthFailed: () => void;
}

/**
 * Configuration options for creating an authenticated HTTP client.
 *
 * @interface CreateApiClientWithAuthOptions
 */
export interface CreateApiClientWithAuthOptions {
  /**
   * Base URL for all API requests.
   * @example 'http://localhost:3000/api/v1' or 'https://api.example.com/api/v1'
   * @type {string}
   */
  baseURL: string;

  /**
   * Your token storage adapter implementation.
   * @type {AuthTokenAdapter}
   */
  auth: AuthTokenAdapter;

  /**
   * Some OAuth providers require the current access token in the refresh request.
   * Set to true only if your backend explicitly requires it.
   *
   * @default false
   * @type {boolean}
   *
   * @example
   * // If your backend requires current token in refresh:
   * { includeAccessTokenInRefreshHeader: true }
   * // Refresh request will include: Authorization: Bearer <current-access-token>
   */
  includeAccessTokenInRefreshHeader?: boolean;

  /**
   * Content-Type header for requests.
   *
   * @default 'application/json'
   * @type {string}
   */
  contentType?: string;
}

/**
 * Creates an Axios HTTP client with automatic JWT token management.
 *
 * The client automatically:
 * 1. Injects Bearer tokens into all request headers
 * 2. Detects 401 Unauthorized responses
 * 3. Refreshes tokens using the refresh endpoint
 * 4. Retries the original request with new tokens
 * 5. Calls onAuthFailed() if refresh fails
 *
 * All of these steps are transparent to your application code.
 *
 * @param {CreateApiClientWithAuthOptions} options - Configuration options
 * @returns {AxiosInstance} Configured Axios instance ready for use
 *
 * @throws {Error} If options.baseURL is not provided or auth adapter is invalid
 *
 * @example
 * ```typescript
 * // Create adapter from your store
 * const adapter: AuthTokenAdapter = {
 *   getAccessToken: () => store.auth.accessToken,
 *   getRefreshToken: () => store.auth.refreshToken,
 *   onRefreshed: (tokens) => {
 *     store.setAuth(tokens);
 *     return true;
 *   },
 *   onAuthFailed: () => {
 *     store.clearAuth();
 *     navigate('/login');
 *   },
 * };
 *
 * // Create client
 * const apiClient = createApiClientWithAuth({
 *   baseURL: 'http://localhost:3000/api/v1',
 *   auth: adapter,
 * });
 *
 * // Use client
 * const user = await apiClient.get('/user/me');
 * // Request automatically includes: Authorization: Bearer <token>
 * // If token expires, refresh happens automatically, request retried
 * ```
 *
 * @example
 * ```typescript
 * // With provider that requires current token in refresh
 * const apiClient = createApiClientWithAuth({
 *   baseURL: 'https://api.example.com/v1',
 *   auth: adapter,
 *   includeAccessTokenInRefreshHeader: true,
 * });
 * // Refresh request will include current access token in Authorization header
 * ```
 *
 * @remarks
 * - Token refresh endpoint must be at: `{baseURL}/auth/refresh`
 * - Refresh endpoint expects: `{ refreshToken: string }` in request body
 * - Refresh endpoint returns: `{ accessToken: string; refreshToken: string }`
 * - Interceptors add `_retry` flag to prevent infinite refresh loops
 * - Only the first 401 triggers refresh; subsequent 401s within same request fail
 *
 * @security
 * - Never store tokens in plain text (use secure storage)
 * - Always use HTTPS in production
 * - Access tokens are included in the Authorization header (Bearer <token>)
 * - Refresh tokens should be stored securely (httpOnly cookie or encrypted storage)
 */
export function createApiClientWithAuth(options: CreateApiClientWithAuthOptions): AxiosInstance {
  const {
    baseURL,
    auth,
    includeAccessTokenInRefreshHeader = false,
    contentType = 'application/json',
  } = options;

  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': contentType },
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = auth.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      if (error.response?.status !== 401 || original?._retry) {
        return Promise.reject(error);
      }

      original._retry = true;

      const refreshToken = auth.getRefreshToken();
      if (!refreshToken) {
        auth.onAuthFailed();
        return Promise.reject(error);
      }

      try {
        const accessToken = auth.getAccessToken();
        const refreshHeaders =
          includeAccessTokenInRefreshHeader && accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined;

        const refreshed = await axios.post<TokenPairLike>(
          `${baseURL}/auth/refresh`,
          { refreshToken },
          refreshHeaders ? { headers: refreshHeaders } : undefined,
        );

        const applied = await auth.onRefreshed(refreshed.data);
        if (!applied) {
          auth.onAuthFailed();
          return Promise.reject(error);
        }

        if (original.headers) {
          original.headers.Authorization = `Bearer ${refreshed.data.accessToken}`;
        }

        return client(original);
      } catch {
        auth.onAuthFailed();
        return Promise.reject(error);
      }
    },
  );

  return client;
}