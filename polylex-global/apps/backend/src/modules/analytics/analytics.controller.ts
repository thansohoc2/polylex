import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('heatmap')
  @ApiOperation({ summary: 'Get review activity heatmap data' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getHeatmap(@CurrentUser() user: AuthUser, @Query('days') days?: number) {
    return this.svc.getHeatmap(user.id, days);
  }

  @Get('velocity')
  @ApiOperation({ summary: 'Get weekly learning velocity (new words mastered)' })
  @ApiQuery({ name: 'weeks', required: false, type: Number })
  getVelocity(@CurrentUser() user: AuthUser, @Query('weeks') weeks?: number) {
    return this.svc.getLearningVelocity(user.id, weeks);
  }

  @Get('retention')
  @ApiOperation({ summary: 'Get retention rate over the last 30 days' })
  getRetention(@CurrentUser() user: AuthUser) {
    return this.svc.getRetentionRate(user.id);
  }
}
