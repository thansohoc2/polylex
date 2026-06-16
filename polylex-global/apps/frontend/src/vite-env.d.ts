/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute backend API base URL, e.g. https://ebms.store/api/v1
   * Leave empty in dev — Vite proxy routes /api → localhost:8000 */
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID_WEB?: string;
  readonly VITE_GOOGLE_CLIENT_ID_IOS?: string;
  readonly VITE_GOOGLE_CLIENT_ID_ANDROID?: string;
  readonly VITE_APPLE_SERVICE_ID?: string;
  /** Apple Service ID for web Sign-in (different from the iOS Bundle ID) */
  readonly VITE_APPLE_WEB_SERVICE_ID?: string;
  /** iOS Bundle ID for native Sign in with Apple (com.truongphatlab.polylex.app) */
  readonly VITE_APPLE_BUNDLE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace google.accounts.oauth2 {
  interface TokenResponse {
    access_token: string;
    error?: string;
    error_description?: string;
  }
  interface ErrorResponse {
    type: string;
  }
  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (r: TokenResponse) => void;
    error_callback?: (e: ErrorResponse) => void;
  }
  interface TokenClient {
    callback: (r: TokenResponse) => void;
    requestAccessToken: (opts?: { prompt?: string }) => void;
  }
  function initTokenClient(config: TokenClientConfig): TokenClient;
}

interface Window {
  google: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (r: { credential: string }) => void;
          use_fedcm_for_prompt?: boolean;
        }) => void;
        prompt: (cb?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        renderButton: (parent: HTMLElement, options: object) => void;
      };
      oauth2: typeof google.accounts.oauth2;
    };
  };
  AppleID: {
    auth: {
      signIn: () => Promise<{ authorization: { id_token: string } }>;
      init: (config: object) => void;
    };
  };
}
