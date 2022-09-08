import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoggerService } from 'logger/logger.service';
import { AppService } from './app.service';

@ApiTags('HealthCheck')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly log: LoggerService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('hooks/:hook')
  handleHookRequest(
    @Body() record: Record<string, unknown>,
    @Param('hook') hookName: string
  ) {
    this.log.log(record, `${hookName} hook`);
    return record;
  }
}
