import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { Persona } from './persona/persona.entity';
import { Tag } from './tag/tag.entity';
import { PersonasController } from './persona/persona.controller';
import { TagsController } from './tag/tag.controller';
import { TagsService } from './tag/tag.service';
import { PersonasService } from './persona/persona.services';
import { PromptsController } from './prompt/prompt.controller';
import { PromptsService } from './prompt/prompt.service';
import { Prompts } from './prompt/prompt.entity';
import { OpenAIController } from './openai/openai.controller';
import { OpenAIService } from './openai/openai.service';
import { ConfigModule } from '@nestjs/config';
import { DatasetImportController } from './import/dataset.controller.js';
import { DatasetImportService } from './import/dataset.service.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || "") || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'qa_with_personas',
      entities: [Persona, Tag, Prompts],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Persona, Tag, Prompts]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot(),
  ],
  controllers: [PersonasController, TagsController, PromptsController, OpenAIController, DatasetImportController],
  providers: [PersonasService, TagsService, PromptsService, OpenAIService, DatasetImportService],
})
export class AppModule { }