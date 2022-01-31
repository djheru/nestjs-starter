import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { LoggerService } from 'logger/logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from './entities/note.entity';
import { Tag } from './entities/tag.entity';
import { Todo } from './entities/todo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Note, Tag, Todo])],
  controllers: [NotesController],
  providers: [NotesService, LoggerService],
})
export class NotesModule {}
