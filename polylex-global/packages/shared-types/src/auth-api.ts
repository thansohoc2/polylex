/**
 * Auth Endpoint Factory
 *
 * Provides a factory function to create standardized auth endpoints (register, login,
 * logout, socialLogin) bound to your Axios client. This ensures type safety and
 * consistent endpoint contracts across frontend, Zalo, and backend.
 *
 * @module auth-api
 * @example
 * ```typescript
 * import { createAuthApi } from '@polylex/shared-types';
 * import { apiClient } from './http-client';
 *
 * const authApi = createAuthApi(apiClient);
 *
 * // Register
 * const reg = await authApi.register({
 *   email: 'user@example.com',
 *   password: 'secure123',
 *   displayName: 'Nguyễn Văn A',
 *   nativeLanguageCode: 'vi',
 * });
 *
 * // Social login
 * const social = await authApi.socialLogin({
 *   provider: 'google',
 *   token: 'id_token_from_google',
 *   nativeLanguageCode: 'vi',
 * });
 * ```
 */

import { AxiosInstance } from 'axios';

/**
 * Supported social login providers.
 * @typedef {string} SocialProvider
 */
export type SocialProvider = 'google' | 'apple' | 'facebook' | 'zalo';

/**
 * Optional Zalo SDK profile data for fallback user creation.
 *
 * When a user logs in via Zalo, the SDK returns profile information.
 * This data is sent to the backend as optional supplement to the access token.
 * Backend always verifies the access token first; only uses this data if the
 * graph API response is incomplete.
 *
 * @interface ZaloProfilePayload
 *
 * @example
 * ```typescript
 * // Zalo SDK returns user info
 * const profile = await zmp.getUserInfo();
 * // Normalize it to ZaloProfilePayload structure
 * const zaloProfile: ZaloProfilePayload = {
 *   providerId: profile.id || profile.userId,
 *   displayName: profile.name || profile.displayName,
 *   avatarUrl: profile.avatar || profile.avatarUrl,
 *   email: profile.email || null,
 * };
 * ```
 *
 * @security
 * SDK profile is NEVER used for authentication decisions. Always verified server-side.
 * Provided only as fallback for user data (displayName, email, avatar).
 */
export interface ZaloProfilePayload {
  /**
   * Zalo user ID from SDK (providerId in backend user_social_account)
   * @type {string}
   */
  providerId: string;

  /**
   * User's display name from SDK. Optional if returned by SDK.
   * @type {string | null}
   */
  displayName?: string | null;

  /**
   * User's avatar URL from SDK. Optional if returned by SDK.
   * @type {string | null}
   */
  avatarUrl?: string | null;

  /**
   * User's email from SDK. Optional if returned by SDK or not public.
   * @type {string | null}
   */
  email?: string | null;
}

/**
 * Payload for social login endpoint.
 *
 * @interface SocialLoginPayload
 *
 * @example
 * ```typescript
 * // Google OAuth
 * const payload: SocialLoginPayload = {
 *   provider: 'google',
 *   token: 'Google id_token',
 *   nativeLanguageCode: 'vi',
 * };
 *
 * // Zalo with Zalo SDK profile
 * const payload: SocialLoginPayload = {
 *   provider: 'zalo',
 *   token: 'Zalo access token from SDK',
 *   nativeLanguageCode: 'vi',
 *   zaloProfile: {
 *     providerId: '123456789',
 *     displayName: 'Nguyễn Văn A',
 *     email: 'user@example.com',
 *     avatarUrl: 'https://...',
 *   },
 * };
 * ```
 */
export interface SocialLoginPayload {
  /**
   * Which provider user authenticated with
   * @type {SocialProvider}
   */
  provider: SocialProvider;

  /**
   * Access token from provider (id_token for Google/Apple, token for Facebook/Zalo)
   * @type {string}
   */
  token: string;

  /**
   * User's preferred language for the application.
   * Backend uses this to set default language preference.
   * @type {string}
   * @example 'vi' (Vietnamese), 'en' (English), etc.
   */
  nativeLanguageCode?: string;

  /**
   * Optional Zalo SDK profile data. Only used when provider === 'zalo'.
   * Backend verifies access token first; uses this only as fallback for user data.
   * @type {ZaloProfilePayload}
   */
  zaloProfile?: ZaloProfilePayload;
}

/**
 * Auth endpoint interface providing standardized methods.
 *
 * Implement this interface to ensure all apps (frontend, Zalo, etc.) have
 * consistent auth endpoint contracts.
 *
 * @interface AuthApi
 */
export interface AuthApi {
  /**
   * Register a new user with email + password.
   *
   * @param {Object} data - Registration data
   * @param {string} data.email - User's email (must be unique)
   * @param {string} data.password - Plain text password (backend will hash)
   * @param {string} data.displayName - User's display name
   * @param {string} data.nativeLanguageCode - User's preferred language (e.g., 'vi')
   * @param {string} [data.timezone] - User's timezone (optional)
   *
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} JWT token pair
   *
   * @throws {AxiosError<{ message: string }>} If email already registered (409) or validation fails (400)
   *
   * @example
   * ```typescript
   * const tokens = await authApi.register({
   *   email: 'user@example.com',
   *   password: 'SecurePassword123!',
   *   displayName: 'Nguyễn Văn A',
   *   nativeLanguageCode: 'vi',
   *   timezone: 'Asia/Ho_Chi_Minh',
   * });
   * // tokens: { accessToken: 'jwt...', refreshToken: 'jwt...' }
   * ```
   */
  register: (data: {
    email: string;
    password: string;
    displayName: string;
    nativeLanguageCode: string;
    timezone?: string;
  }) => Promise<{ accessToken: string; refreshToken: string }>;

  /**
   * Login with email + password.
   *
   * @param {Object} data - Login credentials
   * @param {string} data.email - User's registered email
   * @param {string} data.password - Plain text password
   *
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} JWT token pair
   *
   * @throws {AxiosError} If credentials invalid (401) or user not found (404)
   *
   * @example
   * ```typescript
   * const tokens = await authApi.login({
   *   email: 'user@example.com',
   *   password: 'SecurePassword123!',
   * });
   * ```
   */
  login: (data: {
    email: string;
    password: string;
  }) => Promise<{ accessToken: string; refreshToken: string }>;

  /**
   * Logout from current session.
   *
   * Clears session on the backend. Frontend should also clear local tokens.
   *
   * @returns {Promise<unknown>} Backend response (implementation varies)
   *
   * @example
   * ```typescript
   * await authApi.logout();
   * // Then clear tokens from store
   * store.clearAuth();
   * ```
   */
  logout: () => Promise<unknown>;

  /**
   * Login with social provider (Google, Apple, Facebook, Zalo).
   *
   * Backend verifies the provider's access token. If this is the user's first login,
   * backend automatically creates a new user account using provider data.
   *
   * @param {SocialLoginPayload} data - Provider token + optional SDK profile
   *
   * @returns {Promise<{ accessToken: string; refreshToken: string; isNewUser: boolean }>}
   *   JWT token pair + flag indicating if account was auto-created
   *
   * @throws {AxiosError} If token verification fails or backend error
   *
   * @example
   * ```typescript
   * // Google OAuth
   * const result = await authApi.socialLogin({
   *   provider: 'google',
   *   token: idToken, // from Google OAuth popup
   *   nativeLanguageCode: 'vi',
   * });
   * // result: { accessToken, refreshToken, isNewUser: true }
   *
   * // Zalo with SDK profile
   * const result = await authApi.socialLogin({
   *   provider: 'zalo',
   *   token: zaloAccessToken,
   *   nativeLanguageCode: 'vi',
   *   zaloProfile: {
   *     providerId: userId,
   *     displayName: 'Nguyễn Văn A',
   *     email: 'user@gmail.com',
   *     avatarUrl: 'https://...',
   *   },
   * });
   * ```
   *
   * @remarks
   * - Backend always verifies provider's access token first (server-side only)
   * - For Zalo, SDK profile is optional supplement (fallback for user data)
   * - If user has another account with same email, returns 409 Conflict
   * - Auto-created accounts use provider data for initial profile (displayName, email, avatar)
   */
  socialLogin: (data: SocialLoginPayload) => Promise<{
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }>;

  issueDemoSession: () => Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
}

/**
 * Creates standardized auth endpoints bound to provided Axios client.
 *
 * This factory ensures all apps (frontend web, Zalo mini app, etc.) have
 * consistent auth endpoint contracts and type safety.
 *
 * @param {AxiosInstance} client - Configured Axios instance (typically from createApiClientWithAuth)
 *
 * @returns {AuthApi} Object with register, login, logout, socialLogin methods
 *
 * @example
 * ```typescript
 * import { createAuthApi, createApiClientWithAuth } from '@polylex/shared-types';
 *
 * // Setup HTTP client with auth
 * const httpClient = createApiClientWithAuth({
 *   baseURL: 'http://localhost:3000/api/v1',
 *   auth: myTokenAdapter,
 * });
 *
 * // Create auth API
 * const authApi = createAuthApi(httpClient);
 *
 * // Use in your components
 * const tokens = await authApi.register({ ... });
 * const social = await authApi.socialLogin({ ... });
 * ```
 *
 * @remarks
 * - Endpoint paths are hardcoded: /auth/register, /auth/login, /auth/logout, /auth/social
 * - All requests use Bearer token from httpClient (Auth interceptor)
 * - All responses are typed for compile-time safety
 * - Errors throw AxiosError for standard error handling
 */
export function createAuthApi(client: AxiosInstance): AuthApi {
  return {
    register: (data) => client.post('/auth/register', data).then((r) => r.data),
    login: (data) => client.post('/auth/login', data).then((r) => r.data),
    logout: () => client.post('/auth/logout').then((r) => r.data),
    socialLogin: (data) =>
      client
        .post<{ accessToken: string; refreshToken: string; isNewUser: boolean }>('/auth/social', data)
        .then((r) => r.data),
    issueDemoSession: () =>
      client
        .post<{ accessToken: string; refreshToken: string }>('/auth/demo')
        .then((r) => r.data),
  };
}