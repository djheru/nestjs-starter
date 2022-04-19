import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paramCase } from 'change-case';
import { PaginationQueryDto } from 'common/dto/pagination-query.dto';
import { LoggerService } from 'logger/logger.service';
import { Repository } from 'typeorm';
import { CreateNoteDto } from './dto/create-note.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './entities/note.entity';
import { Tag } from './entities/tag.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private readonly noteRepository: Repository<Note>,
    @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>,
    private readonly log: LoggerService
  ) {}

  async create(createNoteDto: CreateNoteDto) {
    const params = {
      ...createNoteDto,
      tags: await this.getTags(createNoteDto.tags),
    };
    const note = await this.noteRepository.create(params);
    const noteEntity = await this.noteRepository.save(note);
    return noteEntity;
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { skip, take } = paginationQuery;
    return this.noteRepository.find({
      relations: ['tags', 'todos'],
      skip,
      take,
    });
  }

  async findOne(id: string) {
    const note = await this.noteRepository.findOne(id);
    if (!note) {
      throw new NotFoundException(`Note ID ${id} not found`);
    }
    return note;
  }

  async update(id: string, updateNoteDto: UpdateNoteDto) {
    const note = this.findOne(id);
    const params = {
      id,
      ...note,
      ...updateNoteDto,
      tags: await this.getTags(updateNoteDto.tags),
    };
    const updatedNote = await this.noteRepository.save(params);
    return updatedNote;
  }

  async remove(id: string) {
    const note = await this.findOne(id);
    const result = await this.noteRepository.softRemove(note);
    return result;
  }

  async getTags(tags: CreateTagDto[]) {
    return tags && tags.length
      ? await Promise.all(tags.map(({ tagName }) => this.findOrCreateTag(tagName)))
      : [];
  }

  async findOrCreateTag(tagName: string) {
    const existingTag = await this.tagRepository.findOne({
      tagName: paramCase(tagName),
    });
    if (existingTag) {
      return existingTag;
    }
    return this.tagRepository.create({ tagName });
  }
}
