import { Test, TestingModule } from '@nestjs/testing';
import { PaginationQueryDto } from 'common/dto/pagination-query.dto';
import { LoggerService } from 'logger/logger.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

type MockNotesService = Partial<Record<keyof NotesService, jest.Mock>>;
const mockMessageService: MockNotesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getTags: jest.fn(),
  findOrCreateTag: jest.fn(),
};

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

describe('NotesController', () => {
  let controller: NotesController;
  let notesService: NotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: mockMessageService,
        },
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    notesService = await module.resolve(NotesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call the service and pass the DTO', async () => {
      await controller.create(createNoteDto);
      expect(notesService.create).toBeCalledWith(createNoteDto);
    });
  });

  describe('findAll', () => {
    it('should call the service and pass the pagination query', async () => {
      await controller.findAll(paginationQuery);
      expect(notesService.findAll).toBeCalledWith(paginationQuery);
    });
  });

  describe('findOne', () => {
    it('should call the service and pass the ID', async () => {
      await controller.findOne(someUUID);
      expect(notesService.findOne).toBeCalledWith(someUUID);
    });
  });

  describe('update', () => {
    it('should call the service and pass the ID and the update DTO', async () => {
      await controller.update(someUUID, updateNoteDto);
      expect(notesService.update).toBeCalledWith(someUUID, updateNoteDto);
    });
  });

  describe('remove', () => {
    it('should call the service and pass the ID', async () => {
      await controller.remove(someUUID);
      expect(notesService.remove).toBeCalledWith(someUUID);
    });
  });
});
