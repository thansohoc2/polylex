import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { SubmitReviewDto, ReviewQueueQueryDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('review')
export class ReviewController {
  constructor(private readonly svc: ReviewService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Get today\'s review queue (timezone-aware)' })
  getQueue(@CurrentUser() user: AuthUser, @Query() query: ReviewQueueQueryDto) {
    return this.svc.getQueue(user.id, query);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit a review result (runs ACRE algorithm)' })
  @HttpCode(HttpStatus.OK)
  submit(@CurrentUser() user: AuthUser, @Body() dto: SubmitReviewDto) {
    return this.svc.submitReview(user.id, dto);
  }
}
