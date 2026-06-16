import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, SocialLoginDto } from './dto/auth.dto';
import { TokenPair } from '@polylex/shared-types';

type SocialProviderEnum = 'GOOGLE' | 'APPLE' | 'FACEBOOK' | 'ZALO';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const language = await this.prisma.language.findUnique({
      where: { code: dto.nativeLanguageCode },
    });
    if (!language) {
      throw new NotFoundException(
        `Language "${dto.nativeLanguageCode}" not found`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        nativeLanguageId: language.id,
        timezone: dto.timezone ?? 'UTC',
      },
    });

    // Create initial streak record
    await this.prisma.userStreak.create({ data: { userId: user.id } });

    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.organizationId,
    );

    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return tokens;
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('This account uses social login. Please sign in with Google or Apple.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.organizationId,
    );

    // Store hashed refresh token
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return tokens;
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub?: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub?: string }>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, organizationId: true, refreshToken: true },
    });

    if (!user?.refreshToken) {
      throw new UnauthorizedException('No active session');
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.organizationId,
    );

    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async issueDemoSession(): Promise<TokenPair> {
    const email = `demo-${randomUUID()}@polylex.guest`;
    const createDemoUser = (role: 'DEMO' | 'LEARNER') =>
      this.prisma.user.create({
        data: {
          email,
          passwordHash: null,
          displayName: 'Demo User',
          role: role as any,
          timezone: 'UTC',
          refreshToken: null,
        },
        select: {
          id: true,
          email: true,
          role: true,
          organizationId: true,
        },
      });

    let demoUser;
    try {
      demoUser = await createDemoUser('DEMO');
    } catch {
      demoUser = await createDemoUser('LEARNER');
    }

    await this.prisma.userStreak.create({
      data: { userId: demoUser.id },
    });

    const payload = {
      sub: demoUser.id,
      email: demoUser.email,
      role: demoUser.role,
      orgId: demoUser.organizationId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_DEMO_EXPIRES_IN', '7d'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: demoUser.id },
      data: { refreshToken: hashedRefresh },
    });

    return { accessToken, refreshToken };
  }

  async socialLogin(dto: SocialLoginDto): Promise<TokenPair & { isNewUser: boolean }> {
    const verified = await this.verifySocialToken(
      dto.provider,
      dto.token,
    );
    const sdkProfile = dto.provider === 'zalo' ? dto.zaloProfile : undefined;

    if (
      dto.provider === 'zalo' &&
      sdkProfile?.providerId &&
      sdkProfile.providerId !== verified.providerId
    ) {
      this.logger.warn(
        `Zalo providerId mismatch between SDK and graph API. Using verified providerId=${verified.providerId}`,
      );
    }

    const providerId = verified.providerId?.trim();
    if (!providerId) {
      throw new UnauthorizedException('Invalid social token');
    }
    const email = verified.email ?? sdkProfile?.email ?? null;
    const displayName = verified.displayName ?? sdkProfile?.displayName ?? null;
    const avatarUrl = verified.avatarUrl ?? sdkProfile?.avatarUrl ?? null;

    // Try to find existing SocialAccount
    const existingAccount = await this.prisma.socialAccount.findUnique({
      where: {
        provider_providerId: {
          provider: dto.provider.toUpperCase() as SocialProviderEnum,
          providerId,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      const tokens = await this.generateTokenPair(
        existingAccount.user.id,
        existingAccount.user.email,
        existingAccount.user.role,
        existingAccount.user.organizationId,
      );
      const hashed = await bcrypt.hash(tokens.refreshToken, 10);
      await this.prisma.user.update({
        where: { id: existingAccount.user.id },
        data: { refreshToken: hashed, lastLoginAt: new Date() },
      });
      return { ...tokens, isNewUser: false };
    }

    // Try to find user by email (account linking)
    let user = email ? await this.prisma.user.findUnique({ where: { email } }) : null;
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const fallbackName = displayName ?? (email ? email.split('@')[0] : 'PolyLex User');
      let nativeLangId: string | null = null;
      if (dto.nativeLanguageCode) {
        const lang = await this.prisma.language.findUnique({
          where: { code: dto.nativeLanguageCode },
        });
        nativeLangId = lang?.id ?? null;
      }
      try {
        user = await this.prisma.user.create({
          data: {
            email: email ?? `social_${dto.provider}_${providerId}@polylex.internal`,
            passwordHash: null,
            displayName: fallbackName,
            nativeLanguageId: nativeLangId,
            isOnboarded: !!nativeLangId,
            timezone: 'UTC',
          },
        });
        await this.prisma.userStreak.create({ data: { userId: user.id } });
      } catch {
        // Race condition: email already registered
        throw new ConflictException('Email already registered. Please sign in with your existing account.');
      }
    }

    // Create SocialAccount link
    await this.prisma.socialAccount.create({
      data: {
        userId: user.id,
        provider: dto.provider.toUpperCase() as SocialProviderEnum,
        providerId,
        email,
        displayName,
        avatarUrl,
      },
    });

    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.organizationId,
    );
    const hashed = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashed, lastLoginAt: new Date() },
    });
    return { ...tokens, isNewUser };
  }

  private async verifySocialToken(
    provider: 'google' | 'apple' | 'facebook' | 'zalo',
    token: string,
  ): Promise<{ providerId: string; email: string | null; displayName: string | null; avatarUrl: string | null }> {
    if (provider === 'google') {
      // JWT id_token has exactly 3 parts (header.payload.signature)
      const isIdToken = token.split('.').length === 3;

      if (isIdToken) {
        // Native (Capacitor GoogleAuth) sends id_token — verify cryptographically
        const { OAuth2Client } = await import('google-auth-library');
        const clientIds = [
          this.config.get<string>('GOOGLE_CLIENT_ID_WEB'),
          this.config.get<string>('GOOGLE_CLIENT_ID_IOS'),
          this.config.get<string>('GOOGLE_CLIENT_ID_ANDROID'),
        ].filter(Boolean) as string[];
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({ idToken: token, audience: clientIds });
        const payload = ticket.getPayload()!;
        return {
          providerId: payload.sub,
          email: payload.email ?? null,
          displayName: payload.name ?? null,
          avatarUrl: payload.picture ?? null,
        };
      } else {
        // Web (initTokenClient popup) sends access_token — fetch userinfo from Google
        const { data } = await this.http.axiosRef.get<{
          sub: string;
          email?: string;
          name?: string;
          picture?: string;
        }>('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        return {
          providerId: data.sub,
          email: data.email ?? null,
          displayName: data.name ?? null,
          avatarUrl: data.picture ?? null,
        };
      }
    }

    if (provider === 'apple') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const appleSignin = require('apple-signin-auth') as {
        verifyIdToken: (token: string, opts?: object) => Promise<Record<string, string>>;
      };
      const payload = await appleSignin.verifyIdToken(token, { ignoreExpiration: false });
      return {
        providerId: payload['sub'],
        email: payload['email'] ?? null,
        displayName: null,
        avatarUrl: null,
      };
    }

    if (provider === 'facebook') {
      const { data } = await this.http.axiosRef.get<{
        id: string;
        name?: string;
        email?: string;
        picture?: { data?: { url?: string } };
      }>(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`);
      return {
        providerId: data.id,
        email: data.email ?? null,
        displayName: data.name ?? null,
        avatarUrl: data.picture?.data?.url ?? null,
      };
    }

    if (provider === 'zalo') {
      try {
        const { data } = await this.http.axiosRef.get<{
          id: string;
          name?: string;
          email?: string;
          picture?: { data?: { url?: string } } | string;
        }>('https://graph.zalo.me/v2.0/me?fields=id,name,picture,email', {
          headers: { access_token: token },
        });
        const avatarUrl =
          typeof data.picture === 'string'
            ? data.picture
            : data.picture?.data?.url ?? null;
        if (!data.id || !data.id.trim()) {
          throw new UnauthorizedException('Invalid Zalo token');
        }
        return {
          providerId: data.id,
          email: data.email ?? null,
          displayName: data.name ?? null,
          avatarUrl,
        };
      } catch {
        throw new UnauthorizedException('Invalid Zalo token');
      }
    }

    throw new UnauthorizedException('Unsupported provider');
  }

  private async generateTokenPair(
    userId: string,
    email: string,
    role: string,
    orgId: string | null,
  ): Promise<TokenPair> {
    const payload = { sub: userId, email, role, orgId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Handles Apple server-to-server notifications.
   * Apple sends a POST with Content-Type: application/x-www-form-urlencoded
   * where `payload` is a signed JWT containing an `events` claim.
   * Events: email-disabled, email-enabled, consent-revoked, account-delete, email-change
   * Docs: https://developer.apple.com/documentation/sign_in_with_apple/processing_changes_for_sign_in_with_apple_accounts
   */
  async handleAppleS2SNotification(rawJwt: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appleSignin = require('apple-signin-auth') as {
      verifyIdToken: (token: string, opts?: object) => Promise<Record<string, unknown>>;
    };

    let decoded: Record<string, unknown>;
    try {
      decoded = await appleSignin.verifyIdToken(rawJwt, { ignoreExpiration: false });
    } catch (err) {
      this.logger.warn('Apple S2S JWT verification failed — ignoring', err);
      return;
    }

    let event: Record<string, unknown>;
    try {
      const eventsRaw = decoded['events'];
      event = JSON.parse(typeof eventsRaw === 'string' ? eventsRaw : JSON.stringify(eventsRaw));
    } catch {
      this.logger.warn('Failed to parse Apple S2S events payload');
      return;
    }

    const type = String(event['type'] ?? '');
    const sub = String(event['sub'] ?? '');
    this.logger.log(`Apple S2S event: type=${type} sub=${sub}`);

    if (!sub) return;

    const socialAccount = await this.prisma.socialAccount.findUnique({
      where: { provider_providerId: { provider: 'APPLE', providerId: sub } },
      include: { user: { include: { socialAccounts: true } } },
    });

    if (!socialAccount) return;

    if (type === 'consent-revoked' || type === 'account-delete') {
      await this.prisma.socialAccount.delete({ where: { id: socialAccount.id } });
      const { user } = socialAccount;
      const otherAccounts = user.socialAccounts.filter((a: { id: string }) => a.id !== socialAccount.id);
      const hasPassword = user.passwordHash !== null;
      if (otherAccounts.length === 0 && !hasPassword) {
        await this.prisma.user.delete({ where: { id: user.id } });
        this.logger.log(`Deleted user ${user.id} — no remaining login methods after Apple ${type}`);
      }
    } else if (type === 'email-change') {
      const newEmail = event['email'] as string | undefined;
      if (newEmail) {
        await this.prisma.socialAccount.update({
          where: { id: socialAccount.id },
          data: { email: newEmail },
        });
      }
    }
    // email-disabled / email-enabled: relay change only, no action needed
  }
}
