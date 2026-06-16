import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional, IsIn } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

class UpdateProfileDto {
  @IsString() @IsOptional() displayName?: string;
  @IsInt() @Min(1) @Max(500) @IsOptional() dailyGoal?: number;
  @IsString() @IsOptional() timezone?: string;
  @IsString() @IsOptional() nativeLanguageCode?: string;
  @IsString() @IsOptional() primaryLearningLanguageCode?: string;
}

class AddLanguageDto {
  @IsString() languageCode: string;
  @IsString() targetCefrLevel: string;
}

class UpdateTtsPreferencesDto {
  @IsIn(['MALE', 'FEMALE']) ttsVoiceGender: 'MALE' | 'FEMALE';
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/languages')
  @ApiOperation({ summary: 'Add a learning language' })
  @HttpCode(HttpStatus.CREATED)
  addLanguage(@CurrentUser() user: AuthUser, @Body() dto: AddLanguageDto) {
    return this.usersService.addLearningLanguage(user.id, dto.languageCode, dto.targetCefrLevel);
  }

  @Get('me/tts-preferences')
  @ApiOperation({ summary: 'Get TTS voice preferences' })
  getTtsPreferences(@CurrentUser() user: AuthUser) {
    return this.usersService.getTtsPreferences(user.id);
  }

  @Patch('me/tts-preferences')
  @ApiOperation({ summary: 'Update TTS voice gender preference' })
  updateTtsPreferences(@CurrentUser() user: AuthUser, @Body() dto: UpdateTtsPreferencesDto) {
    return this.usersService.updateTtsPreferences(user.id, dto.ttsVoiceGender);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser() user: AuthUser): Promise<void> {
    await this.usersService.deleteAccount(user.id);
  }
}
