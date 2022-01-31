import { INestApplication, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'auth/auth.module';
import databaseConfig, { databases } from 'config/database.config';
import { LoggerModule } from 'logger/logger.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotesModule } from './notes/notes.module';

export const appModuleDocumentation = (app: INestApplication): void => {
  const options = new DocumentBuilder()
    .setTitle('Note Taker')
    .setDescription('API for access to the Note Taker Application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);
};

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig.recipeBlog],
    }),
    LoggerModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get(databases.NOTE_TAKER),
    }),
    AuthModule,
    NotesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
