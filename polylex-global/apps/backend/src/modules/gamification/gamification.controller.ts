import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { LeaderboardQueryDto } from './dto/leaderboard.dto';

@ApiTags('gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly svc: GamificationService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get user gamification stats (streak, XP, badges)' })
  getStats(@CurrentUser() user: AuthUser) {
    return this.svc.getStats(user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get weekly XP leaderboard with current user rank' })
  getLeaderboard(
    @CurrentUser() user: AuthUser,
    @Query() query: LeaderboardQueryDto,
  ) {
    return this.svc.getLeaderboard(user.id, query.limit ?? 20);
  }
}
