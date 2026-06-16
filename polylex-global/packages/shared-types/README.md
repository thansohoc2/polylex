# @polylex/shared-types

Shared types, interfaces, and factory functions for the polylex platform. Used by all frontend applications (web/iOS, Zalo mini app) to maintain type safety and consistency across codebases.

## Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [Core Concepts](#core-concepts)
  - [AuthTokenAdapter Interface](#authtokenadapter-interface)
  - [createApiClientWithAuth() Factory](#createapiclientwithauth-factory)
  - [createAuthApi() Factory](#createauthapi-factory)
  - [Shared Endpoint Factories](#shared-endpoint-factories)
  - [Migrating Existing Clients](#migrating-existing-clients)
- [Security Model](#security-model)
- [Usage Examples](#usage-examples)
  - [Frontend Web Setup](#frontend-web-setup)
  - [Zalo Mini App Setup](#zalo-mini-app-setup)
  - [With Zustand Store](#with-zustand-store)
  - [With localStorage](#with-localstorage)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [FAQ](#faq)

## Overview

This package provides production-ready patterns for:

1. **JWT Token Management**: Automatic access token refresh on 401 responses
2. **Unified Auth Endpoints**: Single factory for register, login, logout, social login
3. **Multi-Provider Social Login**: Google, Apple, Facebook, Zalo with optional SDK profile fallback
4. **Type Safety**: Fully typed interfaces for all consumption patterns

**Key Principle**: Token verification happens server-side first. Optional fallbacks (like Zalo SDK profile) are never the source of truth.

## Installation & Setup

### 1. Install Dependencies

```bash
npm install @polylex/shared-types
```

Or if in monorepo workspace:

```bash
npm install  # installs all workspaces including shared-types
```

### 2. Import in Your App

```typescript
import {
  createApiClientWithAuth,
  createAuthApi,
  type AuthTokenAdapter,
  type TokenPairLike,
  type SocialLoginPayload,
} from '@polylex/shared-types';
```

## Core Concepts

### AuthTokenAdapter Interface

The `AuthTokenAdapter` is a contract that your app's token storage implementation must fulfill. This allows `createApiClientWithAuth()` to remain agnostic about **where** tokens are stored (localStorage, Zustand, etc.).

```typescript
export interface AuthTokenAdapter {
  /**
   * Get the current access token from storage.
   * @returns The access token string, or null if not available
   */
  getAccessToken: () => string | null;

  /**
   * Get the current refresh token from storage.
   * @returns The refresh token string, or null if not available
   */
  getRefreshToken: () => string | null;

  /**
   * Called when a new token pair is obtained (e.g., after refresh).
   * Update your storage with the new tokens.
   * @param tokens The new access + refresh token pair
   * @returns true if tokens were saved successfully, false otherwise
   */
  onRefreshed: (tokens: TokenPairLike) => boolean | Promise<boolean>;

  /**
   * Called when authentication fails irreversibly (token invalid, user deleted, etc).
   * Clear tokens and redirect user to login.
   */
  onAuthFailed: () => void;
}
```

**Implementation Example (Zustand Store):**

```typescript
import { useAuthStore } from './store';

const adapter: AuthTokenAdapter = {
  getAccessToken: () => useAuthStore.getState().accessToken || null,
  getRefreshToken: () => useAuthStore.getState().refreshToken || null,
  onRefreshed: async (tokens) => {
    useAuthStore.setState({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return true;
  },
  onAuthFailed: () => {
    useAuthStore.setState({ accessToken: null, refreshToken: null });
    window.location.href = '/login';
  },
};
```

### createApiClientWithAuth() Factory

Creates an Axios instance with automatic JWT token management and refresh logic.

```typescript
export interface CreateApiClientWithAuthOptions {
  /** Base URL of your API (e.g., 'http://localhost:3000/api/v1') */
  baseURL: string;

  /** Your AuthTokenAdapter implementation */
  auth: AuthTokenAdapter;

  /**
   * Some providers require the current access token in the refresh request.
   * @default false
   */
  includeAccessTokenInRefreshHeader?: boolean;

  /**
   * Content-Type header for requests.
   * @default 'application/json'
   */
  contentType?: string;
}

export function createApiClientWithAuth(
  options: CreateApiClientWithAuthOptions
): AxiosInstance
```

**Request Interceptor:**
- Automatically adds Bearer token to all requests: `Authorization: Bearer <token>`
- Executes before each request

**Response Interceptor (Auto-Refresh Logic):**
- When a 401 Unauthorized response is received:
  - Checks if refresh token exists
  - Calls `/auth/refresh` endpoint with refresh token
  - Backend returns new token pair
  - Updates token storage via `AuthTokenAdapter.onRefreshed()`
  - **Retries original request** with new token
  - If refresh fails, calls `AuthTokenAdapter.onAuthFailed()` and rejects
- Non-401 errors pass through normal error handling

**Usage:**

```typescript
const apiClient = createApiClientWithAuth({
  baseURL: 'http://localhost:3000/api/v1',
  auth: authTokenAdapter,
});

// Now all requests have Bearer token + auto-refresh
const response = await apiClient.get('/user/me');
// If token expired, refresh happens transparently,
// original request retried, user sees no interruption
```

### createAuthApi() Factory

Creates standardized auth endpoints (register, login, logout, socialLogin) bound to your Axios instance.

```typescript
export interface SocialLoginPayload {
  provider: 'google' | 'apple' | 'facebook' | 'zalo';
  token: string;
  nativeLanguageCode?: string;
  /**
   * Optional: Zalo SDK profile data for fallback user creation.
   * Backend uses token for verification; this is supplement only.
   */
  zaloProfile?: ZaloProfilePayload;
}

export interface AuthApi {
  /**
   * Register new user with email + password
   */
  register: (data: {
    email: string;
    password: string;
    displayName: string;
    nativeLanguageCode: string;
    timezone?: string;
  }) => Promise<{ accessToken: string; refreshToken: string }>;

  /**
   * Login with email + password
   */
  login: (data: {
    email: string;
    password: string;
  }) => Promise<{ accessToken: string; refreshToken: string }>;

  /**
   * Logout (clears session on backend)
   */
  logout: () => Promise<unknown>;

  /**
   * Social login with Google/Apple/Facebook/Zalo
   */
  socialLogin: (data: SocialLoginPayload) => Promise<{
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean; // true if user was auto-created
  }>;
}

export function createAuthApi(client: AxiosInstance): AuthApi
```

**Usage:**

```typescript
const authApi = createAuthApi(apiClient);

// Register
const response = await authApi.register({
  email: 'user@example.com',
  password: 'secure123',
  displayName: 'Nguyễn Văn A',
  nativeLanguageCode: 'vi',
});
// response: { accessToken: '...', refreshToken: '...' }

// Social login (Google)
const google = await authApi.socialLogin({
  provider: 'google',
  token: 'id_token_from_google',
  nativeLanguageCode: 'vi',
});
// response: { accessToken: '...', refreshToken: '...', isNewUser: true }

// Social login (Zalo with SDK profile)
const zalo = await authApi.socialLogin({
  provider: 'zalo',
  token: 'access_token_from_zalo_sdk',
  nativeLanguageCode: 'vi',
  zaloProfile: {
    providerId: '123456789',
    displayName: 'Nguyễn Văn B',
    email: 'user@zalo.me',
    avatarUrl: 'https://...',
  },
});
// Backend verifies token first; uses SDK profile as fallback for user data

### Shared Endpoint Factories

In addition to auth, the package now exposes domain-specific API factories for the
rest of the app surface:

- `createUserApi(client)`
- `createVocabularyApi(client)`
- `createReviewApi(client)`
- `createPathApi(client)`
- `createAnalyticsApi(client)`
- `createGamificationApi(client)`

Example:

```typescript
import {
  createApiClientWithAuth,
  createUserApi,
  createVocabularyApi,
  createReviewApi,
} from '@polylex/shared-types';

const client = createApiClientWithAuth({
  baseURL: '/api/v1',
  auth: authTokenAdapter,
});

export const userApi = createUserApi(client);
export const vocabularyApi = createVocabularyApi(client);
export const reviewApi = createReviewApi(client);
```

### Migrating Existing Clients

The recommended migration path is to keep your exported client names stable and
swap only the implementation behind them.

Before:

```typescript
export const userApi = {
  getMe: () => apiClient.get('/users/me').then((r) => r.data),
  updateMe: (data) => apiClient.patch('/users/me', data).then((r) => r.data),
};
```

After:

```typescript
import { createUserApi } from '@polylex/shared-types';

export const userApi = createUserApi(apiClient);
```

This preserves backwards compatibility for existing imports while consolidating
endpoint definitions into a single shared source of truth.
```

## Security Model

### ✅ What Is Verified

1. **Access Token**: Verified by backend on every request (bearer token)
2. **Refresh Token**: Verified by backend when requesting new token pair
3. **Social Provider Token**: Verified by backend (Google key, Apple key, Facebook key, Zalo graph API)

### ⚠️ What Is NOT Verified Locally

- Zalo SDK profile data is **optional supplement only**
- Used only if backend's graph API response is incomplete
- Never used for authentication decisions (token always first)
- Developer should never trust SDK data without server verification

### 🔐 Token Lifecycle

```
1. User logs in (OAuth or email/password)
2. Backend creates JWT token pair:
   - accessToken (short-lived, 15 min)
   - refreshToken (long-lived, 30 days)
3. Frontend stores both tokens
4. Every request includes accessToken in Authorization header
5. When access token expires (401):
   - Frontend calls /auth/refresh with refreshToken
   - Backend validates refreshToken, creates new pair
   - Frontend updates storage, retries request
6. When refreshToken expires:
   - Refresh call fails with 401
   - Frontend clears tokens, redirects to login
```

## Usage Examples

### Frontend Web Setup

```typescript
// src/api/client.ts
import { createApiClientWithAuth, createAuthApi } from '@polylex/shared-types';
import { useAuthStore } from '../store/auth';

const authTokenAdapter = {
  getAccessToken: () => useAuthStore.getState().accessToken || null,
  getRefreshToken: () => useAuthStore.getState().refreshToken || null,
  onRefreshed: (tokens) => {
    useAuthStore.setState({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return true;
  },
  onAuthFailed: () => {
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
    window.location.href = '/login';
  },
};

export const apiClient = createApiClientWithAuth({
  baseURL: 'http://localhost:3000/api/v1',
  auth: authTokenAdapter,
});

export const authApi = createAuthApi(apiClient);
```

### Zalo Mini App Setup

```typescript
// src/api/client.ts
import { createApiClientWithAuth, createAuthApi } from '@polylex/shared-types';
import { useAuthStore } from '../store/auth';

const authTokenAdapter = {
  getAccessToken: () => useAuthStore.getState().accessToken || null,
  getRefreshToken: () => useAuthStore.getState().refreshToken || null,
  onRefreshed: (tokens) => {
    useAuthStore.setState({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return true;
  },
  onAuthFailed: () => {
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
    // Mini app doesn't have window.location; handle gracefully
    // Could show toast + redirect via custom router
  },
};

export const miniAppClient = createApiClientWithAuth({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  auth: authTokenAdapter,
});

export const miniAuthApi = createAuthApi(miniAppClient);
```

### With Zustand Store

See AuthTokenAdapter section above for Zustand implementation.

### With localStorage

If you prefer plain localStorage (not recommended for sensitive tokens in production):

```typescript
const authTokenAdapter: AuthTokenAdapter = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  onRefreshed: (tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    return true;
  },
  onAuthFailed: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  },
};
```

**⚠️ Security Note**: Prefer secure storage (localStorage with httpOnly flags, or Zustand with persist middleware that respects secure boundaries).

## API Reference

### Exported Types

```typescript
// Token pair (access + refresh)
interface TokenPairLike {
  accessToken: string;
  refreshToken: string;
}

// Storage adapter contract
interface AuthTokenAdapter {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  onRefreshed(tokens: TokenPairLike): boolean | Promise<boolean>;
  onAuthFailed(): void;
}

// Auth client options
interface CreateApiClientWithAuthOptions {
  baseURL: string;
  auth: AuthTokenAdapter;
  includeAccessTokenInRefreshHeader?: boolean;
  contentType?: string;
}

// Social login payload
interface SocialLoginPayload {
  provider: 'google' | 'apple' | 'facebook' | 'zalo';
  token: string;
  nativeLanguageCode?: string;
  zaloProfile?: ZaloProfilePayload;
}

// Optional Zalo SDK profile fallback
interface ZaloProfilePayload {
  providerId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
}

// Auth endpoint contract
interface AuthApi {
  register(...): Promise<{ accessToken; refreshToken }>;
  login(...): Promise<{ accessToken; refreshToken }>;
  logout(): Promise<unknown>;
  socialLogin(...): Promise<{ accessToken; refreshToken; isNewUser }>;
}
```

### Exported Functions

```typescript
// Create Axios with JWT + refresh logic
function createApiClientWithAuth(
  options: CreateApiClientWithAuthOptions
): AxiosInstance

// Create standardized auth endpoints
function createAuthApi(client: AxiosInstance): AuthApi
```

## Error Handling

### Network Errors

Handled by Axios standard error handling. Check `error.response.status`:

```typescript
try {
  await apiClient.get('/user/me');
} catch (error) {
  if (error.response?.status === 404) {
    console.error('User not found');
  } else if (error.request && !error.response) {
    console.error('Network error - no response from server');
  } else {
    console.error('Request setup error', error.message);
  }
}
```

### 401 Unauthorized After Refresh

If refresh also fails with 401:

```typescript
// In AuthTokenAdapter.onAuthFailed():
// 1. Clear tokens from storage
// 2. Redirect to login page
// 3. Show toast: "Session expired, please log in again"

// This is the ONLY time 401 should reach your component
```

### 409 Conflict (Email Already Exists)

During registration:

```typescript
try {
  await authApi.register({
    email: 'existing@example.com',
    password: 'password123',
    displayName: 'User',
    nativeLanguageCode: 'vi',
  });
} catch (error) {
  if (error.response?.status === 409) {
    console.error('Email already registered');
  }
}
```

## Best Practices

### ✅ DO

1. **Initialize once per app**: Create `authApi` and `apiClient` once, reuse everywhere
   ```typescript
   // ✅ Good: single instance
   export const apiClient = createApiClientWithAuth(...);
   export const authApi = createAuthApi(apiClient);
   ```

2. **Store tokens securely**: Use secure storage mechanism
   ```typescript
   // ✅ Good: Zustand with secure middleware
   // ❌ Bad: Plain localStorage (XSS vulnerable)
   ```

3. **Handle onAuthFailed gracefully**: Give user clear feedback
   ```typescript
   onAuthFailed: () => {
     // Clear state
     // Show toast message
     // Redirect to login
   }
   ```

4. **Validate social provider tokens server-side**: Never trust SDK data
   ```typescript
   // ✅ Backend always verifies token first
   // ✅ SDK profile used only as fallback
   ```

5. **Use TypeScript strict mode**: Catch type errors early
   ```bash
   npm run tsc -- --noEmit --strict
   ```

### ❌ DON'T

1. **Don't create multiple instances**: Each app should have ONE apiClient
   ```typescript
   // ❌ Bad: creates new instance on each call
   const apiClient = createApiClientWithAuth(...);
   ```

2. **Don't store tokens in plain localStorage**: Use secure flags
   ```typescript
   // ❌ Bad: vulnerable to XSS
   localStorage.setItem('token', token);
   ```

3. **Don't trust Zalo SDK profile for auth**: Always verify token server-side
   ```typescript
   // ❌ Bad: making auth decisions based on SDK profile
   if (zaloProfile?.providerId === expectedId) { /* auth */ }
   ```

4. **Don't create new AuthTokenAdapter per request**: Reuse same instance
   ```typescript
   // ❌ Bad: creates new adapter each time
   const apiClient = createApiClientWithAuth({
     auth: { getAccessToken: () => store.get().token, ... }
   });
   ```

5. **Don't swallow 401 errors in components**: Let interceptor handle refresh
   ```typescript
   // ❌ Bad: manual refresh handling
   try {
     await apiClient.get('/data');
   } catch (e) {
     if (e.status === 401) { /* manual refresh */ }
   }
   // ✅ Good: interceptor handles it automatically
   ```

## FAQ

### Q: What if the user's token expires between page loads?

**A:** On page load, if you have a stored refreshToken:
1. First request will get 401
2. Interceptor will call /auth/refresh
3. If successful, tokens updated, request retried
4. If fails, user redirected to login

This is transparent to your components.

### Q: Do I need to call onAuthFailed manually?

**A:** No. Only the interceptor calls it when refresh fails. Your components should just use the token via the adapter.

### Q: Can I use this without Zustand?

**A:** Yes! You can use any storage mechanism. Just implement AuthTokenAdapter:
- localStorage
- sessionStorage
- React Context + custom hook
- Redux
- Any other state management

The factory is agnostic.

### Q: What's the difference between Zalo profile and token verification?

**A:** 
- **Token**: Cryptographically signed by Zalo. Backend verifies signature. Is source of truth.
- **SDK Profile**: Just data from SDK response. Could be stale, wrong, or fake. Never used for auth decisions.

Backend always verifies token first, then optionally uses profile for fallback user data.

### Q: Do I need to handle CORS?

**A:** No, not in this package. CORS is configured on the backend. Axios will throw if backend rejects the origin.

### Q: Can I add custom headers to all requests?

**A:** Yes, use Axios interceptor:

```typescript
apiClient.interceptors.request.use((config) => {
  config.headers['X-Custom-Header'] = 'value';
  return config;
});
```

Make sure to add this AFTER creating the client (doesn't override auth interceptor).

### Q: What if backend doesn't support /auth/refresh?

**A:** Modify your AuthTokenAdapter.onAuthFailed() to handle accordingly. Or provide a custom `/api/v1/{endpoint}` that your backend does support.

### Q: Is this production-ready?

**A:** Yes. It's implementing battle-tested JWT + refresh token patterns used by countless production apps. However:
1. Always use HTTPS in production
2. Always use secure token storage
3. Follow your backend's security best practices
4. Regularly rotate secrets

---

## Support & Contributing

Found an issue? Have a suggestion?

1. Check this README first (might be answered in FAQ)
2. Review your implementation against Best Practices
3. Check code examples in TICKET-028 validation tests
4. Reach out to team tech lead

---

**Last Updated:** March 21, 2026  
**Version:** 0.1.0  
**Status:** Production Ready ✅
