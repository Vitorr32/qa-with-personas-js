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

console.log(process.env)

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || "") || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'qa_with_personas',
      entities: [Persona, Tag],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Persona, Tag]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [PersonasController, TagsController],
  providers: [PersonasService, TagsService],
})
export class AppModule { }