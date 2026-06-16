import { Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('updates')
@Controller('updates')
export class UpdatesController {
  constructor(private readonly config: ConfigService) {}

  @Get('latest')
  @ApiOperation({ summary: 'Check for OTA bundle update' })
  @ApiQuery({ name: 'currentVersion', required: false, description: 'Current bundle version installed on device' })
  @ApiQuery({ name: 'platform', required: false, description: 'Platform: ios | android' })
  getLatest(
    @Query('currentVersion') currentVersion?: string,
    @Query('platform') _platform?: string,
  ) {
    const version = this.config.get<string>('OTA_CURRENT_VERSION', '0.0.0+dev');
    const url = this.config.get<string>('OTA_BUNDLE_URL', '') ?? '';
    const hasUpdate = !!url && !!version && version !== currentVersion;

    return {
      version,
      url: url || null,
      mandatory: false,
      hasUpdate,
    };
  }
}
