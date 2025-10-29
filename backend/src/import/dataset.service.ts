import { Injectable, OnModuleInit } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from '../persona/persona.entity';
import { Tag } from '../tag/tag.entity';
import { DatasetParser, ImportProgress } from './parsers/parser.interface';
import { CsvPersonaV1Parser } from './parsers/csv-persona-v1.parser';

export type ParserKey = 'csv_persona_v1';

@Injectable()
export class DatasetImportService implements OnModuleInit {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'imports');

  private readonly parsers = new Map<ParserKey, DatasetParser>();

  constructor(
    @InjectRepository(Persona) private readonly personaRepo: Repository<Persona>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
  ) {
    // register available parsers
    this.parsers.set('csv_persona_v1', new CsvPersonaV1Parser());
  }

  async onModuleInit() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  getMulterOptions() {
    return {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, this.uploadDir),
        filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
      }),
      // Don't set a tiny fileSize limit; allow large uploads when disk allows
      limits: { files: 1 },
    };
  }

  async importFile(filePath: string, parserKey: ParserKey, batchSize?: number): Promise<ImportProgress> {
    const parser = this.parsers.get(parserKey);
    if (!parser) {
      throw new Error(`Unknown parser: ${parserKey}`);
    }

    try {
      const result = await parser.parse(filePath, {
        personaRepo: this.personaRepo,
        tagRepo: this.tagRepo,
        batchSize: batchSize ?? 250,
      });
      return result;
    } finally {
      // cleanup uploaded file after processing
      try { await fs.unlink(filePath); } catch { /* ignore */ }
    }
  }
}
