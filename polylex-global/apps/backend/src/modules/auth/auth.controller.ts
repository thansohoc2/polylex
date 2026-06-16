import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, SocialLoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.id);
  }

  @Post('social')
  @ApiOperation({ summary: 'Login or register with social provider (Google / Apple / Facebook / Zalo)' })
  @HttpCode(HttpStatus.OK)
  socialLogin(@Body() dto: SocialLoginDto) {
    return this.authService.socialLogin(dto);
  }

  @Post('demo')
  @ApiOperation({ summary: 'Issue demo access token for unauthenticated sessions' })
  @HttpCode(HttpStatus.OK)
  issueDemoSession() {
    return this.authService.issueDemoSession();
  }

  /**
   * Apple server-to-server notification webhook.
   * Apple POSTs application/x-www-form-urlencoded with a `payload` field
   * containing a signed JWT. Register this URL in Apple Developer Portal:
   * https://ebms.store/api/v1/auth/apple/notifications
   */
  @Post('apple/notifications')
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  appleNotification(@Body('payload') payload: string) {
    return this.authService.handleAppleS2SNotification(payload ?? '');
  }
}
