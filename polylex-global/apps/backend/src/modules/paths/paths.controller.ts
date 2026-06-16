import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PathsService } from './paths.service';
import { GeneratePathDto } from './dto/paths.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('paths')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('paths')
export class PathsController {
  constructor(private readonly svc: PathsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'AI-generate a learning path and auto-enroll user' })
  @HttpCode(HttpStatus.CREATED)
  generate(@Body() dto: GeneratePathDto, @CurrentUser() user: AuthUser) {
    return this.svc.createFromAI(user.id, dto, user.role, user.email);
  }

  @Get('my')
  @ApiOperation({ summary: 'List all learning paths the current user is enrolled in' })
  getMyPaths(@CurrentUser() user: AuthUser) {
    return this.svc.getMyPaths(user.id);
  }

  @Get(':pathTemplateId')
  @ApiOperation({ summary: 'Get a specific learning path with stage details' })
  getPath(@Param('pathTemplateId') pathTemplateId: string, @CurrentUser() user: AuthUser) {
    return this.svc.getPathById(user.id, pathTemplateId);
  }

  @Post('stages/:userPathStageId/complete')
  @ApiOperation({ summary: 'Mark a stage as complete and unlock the next stage' })
  @HttpCode(HttpStatus.OK)
  completeStage(
    @Param('userPathStageId') userPathStageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.svc.completeStage(user.id, userPathStageId);
  }

  @Get('stages/:pathStageId/dialogue')
  @ApiOperation({ summary: 'Get AI-generated dialogue for a specific stage' })
  getStageDialogue(
    @Param('pathStageId') pathStageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.svc.getStageDialogue(user.id, pathStageId);
  }

  @Get('stages/:pathStageId/videos')
  @ApiOperation({ summary: 'Get AI-ranked YouTube video suggestions for a specific stage' })
  getStageVideos(
    @Param('pathStageId') pathStageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.svc.getStageVideos(user.id, pathStageId);
  }
}
