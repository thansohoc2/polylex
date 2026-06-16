export type SocialLoginProvider = 'google' | 'apple' | 'facebook' | 'zalo';
export type ButtonVariant = 'primary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type LoadingSpinnerSize = 'xs' | 'sm' | 'md' | 'lg';
export type LoadingSpinnerVariant = 'dots' | 'ring' | 'bars';

export interface SocialLoginResult {
  accessToken: string;
  refreshToken: string;
  isNewUser?: boolean;
}

export interface SocialLoginRequestDto {
  provider: SocialLoginProvider;
  token: string;
  zaloProfile?: {
    providerId: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    email?: string | null;
  };
}

export interface SocialLoginError {
  code: string;
  message: string;
}
