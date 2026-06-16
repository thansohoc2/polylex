import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SocialLoginButton } from './SocialLoginButton';

describe('SocialLoginButton', () => {
  it('calls socialLoginFn and onSuccess when clicked', async () => {
    const getToken = vi.fn().mockResolvedValue({ token: 'token-1' });
    const socialLoginFn = vi.fn().mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      isNewUser: false,
    });
    const onSuccess = vi.fn();

    render(
      <SocialLoginButton
        provider="google"
        getToken={getToken}
        socialLoginFn={socialLoginFn}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(getToken).toHaveBeenCalledTimes(1);
      expect(socialLoginFn).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
