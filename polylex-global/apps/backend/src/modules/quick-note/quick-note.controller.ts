import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuickNoteService } from './quick-note.service';
import { CreateQuickNoteDto } from './dto/quick-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('quick-notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quick-notes')
export class QuickNoteController {
  constructor(private readonly quickNoteService: QuickNoteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a word for AI enrichment' })
  create(@Body() dto: CreateQuickNoteDto, @CurrentUser() user: AuthUser) {
    return this.quickNoteService.create(user.id, dto, user.role, user.email);
  }

  @Get()
  @ApiOperation({ summary: 'List all quick notes for the current user' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.quickNoteService.findAll(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a quick note' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.quickNoteService.remove(user.id, id);
  }
}
