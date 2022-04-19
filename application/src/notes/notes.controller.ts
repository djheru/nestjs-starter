import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { LoggerService } from 'logger/logger.service';
import { PaginationQueryDto } from 'common/dto/pagination-query.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';

@Controller('notes')
@ApiTags('Notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly log: LoggerService
  ) {}

  @Post()
  create(@Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(createNoteDto);
  }

  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.notesService.findAll(paginationQuery);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.update(id, updateNoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notesService.remove(id);
  }
}
