import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LanguagesService } from './languages.service';

@ApiTags('languages')
@Controller('languages')
export class LanguagesController {
  constructor(private readonly svc: LanguagesService) {}

  @Get()
  @ApiOperation({ summary: 'List all active languages' })
  findAll() {
    return this.svc.findAll();
  }
}
