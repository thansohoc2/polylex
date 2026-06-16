import { IsEmail, IsString, IsIn, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword1!' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName: string;

  @ApiProperty({ example: 'vi', description: 'Native language code' })
  @IsString()
  nativeLanguageCode: string;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh', required: false })
  @IsString()
  timezone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword1!' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  refreshToken: string;
}

export class ZaloProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;
}

export class SocialLoginDto {
  @ApiProperty({ enum: ['google', 'apple', 'facebook', 'zalo'] })
  @IsIn(['google', 'apple', 'facebook', 'zalo'])
  provider: 'google' | 'apple' | 'facebook' | 'zalo';

  @ApiProperty({ description: 'ID token (Google/Apple) or access token (Facebook)' })
  @IsString()
  @MinLength(10)
  token: string;

  @ApiProperty({ example: 'vi', required: false })
  @IsOptional()
  @IsString()
  nativeLanguageCode?: string;

  @ApiProperty({
    required: false,
    description: 'Optional Zalo SDK profile used as fallback data for account creation/linking',
    example: {
      providerId: 'zalo-user-123',
      displayName: 'Nguyen Van A',
      avatarUrl: 'https://example.com/avatar.png',
      email: 'user@example.com',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ZaloProfileDto)
  zaloProfile?: ZaloProfileDto;
}
