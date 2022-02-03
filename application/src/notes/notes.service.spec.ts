import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoggerService } from 'logger/logger.service';
import { Connection, Repository } from 'typeorm';
import { Note } from './entities/note.entity';
import { Tag } from './entities/tag.entity';
import { NotesService } from './notes.service';

// Type for Mock Repository - It's a partial Record with the keys of a
// real Repository, and the value subbed to a jest mock
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

// This functiion returns a mock repository based on the provided token
const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOne: jest.fn(),
  create: jest.fn(),
});

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
});
