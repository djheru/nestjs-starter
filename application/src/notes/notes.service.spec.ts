import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'common/dto/pagination-query.dto';
import { LoggerService } from 'logger/logger.service';
import { Connection, Repository } from 'typeorm';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './entities/note.entity';
import { Tag } from './entities/tag.entity';
import { NotesService } from './notes.service';

// Type for Mock Repository - It's a partial Record with the keys of a
// real Repository, and the value subbed to a jest mock
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

// This functiion returns a mock repository based on the provided token
const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn().mockReturnValue(createNoteDto),
  save: jest.fn(),
  softRemove: jest.fn(),
});

const someUUID = 'some-uuid';

const createNoteDto: CreateNoteDto = {
  title: 'My note title',
  description: 'This is the description of my note',
  details: 'This includes details about the note',
  tags: [{ tagName: 'Stuff' }, { tagName: 'More Tags' }],
  todos: [
    {
      text: 'Make a todo list',
      isCompleted: false,
    },
  ],
};

const updateNoteDto: UpdateNoteDto = {
  title: 'My UPDATED note title',
  description: 'This is the UPDATED description of my note',
  details: 'This includes UPDATED details about the note',
  tags: [{ tagName: 'Stuff' }, { tagName: 'More Tags' }, { tagName: 'UPDATED tag' }],
  todos: [
    {
      text: 'Make an UPDATED todo list',
      isCompleted: true,
    },
  ],
};

const paginationQuery: PaginationQueryDto = {
  take: 10,
  skip: 100,
};

describe('NotesService', () => {
  let service: NotesService;
  let noteRepository: MockRepository;
  let tagRepository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        LoggerService,
        { provide: Connection, useValue: {} },
        {
          provide: getRepositoryToken(Note),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Tag),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    noteRepository = module.get<MockRepository>(getRepositoryToken(Note));
    tagRepository = module.get<MockRepository>(getRepositoryToken(Tag));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call the repository to save the DTO', async () => {
      await service.create(createNoteDto);
      expect(noteRepository.create).toBeCalled;
      expect(noteRepository.save).toBeCalled;
      expect(tagRepository.findOne).toBeCalled;
    });
  });

  describe('findAll', () => {
    it('should call the repository to find the page of notes', async () => {
      await service.findAll(paginationQuery);
      expect(noteRepository.find).toBeCalled;
    });
  });

  describe('findOne', () => {
    it('should call the repository to find the note', async () => {
      await service.findOne(someUUID);
      expect(noteRepository.findOne).toBeCalled;
    });
  });

  describe('update', () => {
    it('should call the repository to save the updated DTO', async () => {
      await service.update(someUUID, updateNoteDto);
      expect(noteRepository.findOne).toBeCalled;
      expect(noteRepository.save).toBeCalled;
      expect(tagRepository.findOne).toBeCalled;
    });
  });

  describe('remove', () => {
    it('should call the repository to remove the note', async () => {
      await service.remove(someUUID);
      expect(noteRepository.softRemove).toBeCalled;
    });
  });
});
