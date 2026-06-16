import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  const configValues: Record<string, string> = {
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '30d',
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    language: {
      findUnique: jest.fn(),
    },
    userStreak: {
      create: jest.fn(),
    },
    socialAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwt = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const config = {
    get: jest.fn((key: string, defaultValue?: string) => {
      return configValues[key] ?? defaultValue;
    }),
  };

  const http = { axiosRef: { get: jest.fn() } };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma as never, jwt as never, config as never, http as never);
  });

  it('register stores hashed refresh token and returns token pair', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.language.findUnique.mockResolvedValue({ id: 'lang-1' });
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'new.user@example.com',
      role: 'USER',
      organizationId: null,
    });
    prisma.userStreak.create.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});

    jwt.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.register({
      email: 'new.user@example.com',
      password: 'StrongPassword1!',
      displayName: 'New User',
      nativeLanguageCode: 'en',
      timezone: 'UTC',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    const savedHash = prisma.user.update.mock.calls[0][0].data.refreshToken as string;
    await expect(bcrypt.compare('refresh-token', savedHash)).resolves.toBe(true);
  });

  it('refresh returns new token pair when refresh token is valid', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1' });

    const storedHash = await bcrypt.hash('incoming-refresh', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'existing@example.com',
      role: 'USER',
      organizationId: null,
      refreshToken: storedHash,
    });

    jwt.signAsync
      .mockResolvedValueOnce('new-access')
      .mockResolvedValueOnce('new-refresh');

    prisma.user.update.mockResolvedValue({});

    const result = await service.refresh('incoming-refresh');

    expect(jwt.verifyAsync).toHaveBeenCalledWith('incoming-refresh', {
      secret: configValues.JWT_REFRESH_SECRET,
    });
    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ refreshToken: expect.any(String) }),
      }),
    );
  });

  it('refresh throws UnauthorizedException when refresh jwt is invalid', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(service.refresh('invalid-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('refresh throws UnauthorizedException when hashed refresh token mismatches', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'existing@example.com',
      role: 'USER',
      organizationId: null,
      refreshToken: await bcrypt.hash('different-refresh', 10),
    });

    await expect(service.refresh('incoming-refresh')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('socialLogin with provider zalo returns token pair for existing social account', async () => {
    http.axiosRef.get.mockResolvedValue({
      data: {
        id: 'zalo-user-1',
        name: 'Zalo User',
        picture: { data: { url: 'https://avatar.example/zalo.png' } },
      },
    });

    prisma.socialAccount.findUnique.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'zalo.user@example.com',
        role: 'LEARNER',
        organizationId: null,
      },
    });

    jwt.signAsync
      .mockResolvedValueOnce('zalo-access-token')
      .mockResolvedValueOnce('zalo-refresh-token');
    prisma.user.update.mockResolvedValue({});

    const result = await service.socialLogin({
      provider: 'zalo',
      token: 'zalo-valid-token-1234567890',
    });

    expect(http.axiosRef.get).toHaveBeenCalledWith(
      'https://graph.zalo.me/v2.0/me?fields=id,name,picture,email',
      { headers: { Authorization: 'Bearer zalo-valid-token-1234567890' } },
    );
    expect(result).toEqual({
      accessToken: 'zalo-access-token',
      refreshToken: 'zalo-refresh-token',
      isNewUser: false,
    });
  });

  it('socialLogin with provider zalo throws UnauthorizedException on invalid token', async () => {
    http.axiosRef.get.mockRejectedValue(new Error('invalid token'));

    await expect(
      service.socialLogin({
        provider: 'zalo',
        token: 'zalo-invalid-token-1234567890',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('socialLogin with provider zalo uses SDK profile as fallback for auto registration', async () => {
    http.axiosRef.get.mockResolvedValue({
      data: {
        id: 'zalo-user-2',
      },
    });

    prisma.socialAccount.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-zalo-2',
      email: 'sdk.zalo@example.com',
      role: 'LEARNER',
      organizationId: null,
    });
    prisma.userStreak.create.mockResolvedValue({});
    prisma.socialAccount.create.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});

    jwt.signAsync
      .mockResolvedValueOnce('zalo-access-token-new')
      .mockResolvedValueOnce('zalo-refresh-token-new');

    const result = await service.socialLogin({
      provider: 'zalo',
      token: 'zalo-valid-token-0987654321',
      zaloProfile: {
        providerId: 'zalo-user-2',
        displayName: 'Zalo SDK User',
        avatarUrl: 'https://avatar.example/sdk-zalo.png',
        email: 'sdk.zalo@example.com',
      },
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          displayName: 'Zalo SDK User',
          email: 'sdk.zalo@example.com',
        }),
      }),
    );

    expect(prisma.socialAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerId: 'zalo-user-2',
          displayName: 'Zalo SDK User',
          email: 'sdk.zalo@example.com',
        }),
      }),
    );

    expect(result).toEqual({
      accessToken: 'zalo-access-token-new',
      refreshToken: 'zalo-refresh-token-new',
      isNewUser: true,
    });
  });
});
