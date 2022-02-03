import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from 'logger/logger.service';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

describe('NotesController', () => {
  let controller: NotesController;
  let notesService: NotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useFactory: () => ({}),
        },
        LoggerService,
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    notesService = await module.resolve(NotesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
