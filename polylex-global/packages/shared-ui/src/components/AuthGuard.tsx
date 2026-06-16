import { useEffect, type ReactNode } from 'react';

export interface AuthGuardProps {
  isAuthenticated: boolean;
  children: ReactNode;
  /** Content to render when not authenticated (e.g. <LoginPage />). Ignored if redirectTo is set. */
  fallback?: ReactNode;
  /** If provided, calls `onRedirect` instead of rendering fallback. */
  redirectTo?: string;
  /** Navigation callback – pass `useNavigate()` result from react-router-dom or zmp-sdk navigation. */
  onRedirect?: (path: string) => void;
}

/**
 * AuthGuard – renders `children` only when authenticated.
 * Router-agnostic: pass `onRedirect` to perform navigation instead of rendering fallback.
 *
 * @example
 * // With react-router-dom
 * const navigate = useNavigate();
 * <AuthGuard isAuthenticated={!!accessToken} redirectTo="/login" onRedirect={navigate}>
 *   <ProtectedPage />
 * </AuthGuard>
 *
 * @example
 * // With inline fallback
 * <AuthGuard isAuthenticated={!!accessToken} fallback={<LoginPage />}>
 *   <ProtectedPage />
 * </AuthGuard>
 */
export function AuthGuard({
  isAuthenticated,
  children,
  fallback = null,
  redirectTo,
  onRedirect,
}: AuthGuardProps) {
  useEffect(() => {
    if (!isAuthenticated && redirectTo && onRedirect) {
      onRedirect(redirectTo);
    }
  }, [isAuthenticated, redirectTo, onRedirect]);

  if (!isAuthenticated) {
    // If we're redirecting, render nothing while navigation occurs.
    if (redirectTo && onRedirect) return null;
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
