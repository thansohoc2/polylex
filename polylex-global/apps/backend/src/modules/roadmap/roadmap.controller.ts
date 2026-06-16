import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RoadmapService } from './roadmap.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('roadmap')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roadmap')
export class RoadmapController {
  constructor(private readonly svc: RoadmapService) {}

  @Get(':languageCode')
  @ApiOperation({ summary: 'Get CEFR roadmap recommendations for a language' })
  getRecommendations(@CurrentUser() user: AuthUser, @Param('languageCode') languageCode: string) {
    return this.svc.getRecommendations(user.id, languageCode);
  }
}
