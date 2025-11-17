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
import { DefaultPersonaParser } from './parsers/default-persona.parser';

export type ParserKey = 'default' | 'csv_persona_v1';

@Injectable()
export class DatasetImportService implements OnModuleInit {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'imports');

  private readonly parsers = new Map<ParserKey, DatasetParser>();

  private readonly jobs = new Map<string, {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    processed: number;
    inserted: number;
    failed: number;
    total?: number;
    error?: string;
    startedAt: number;
    updatedAt: number;
    parser: ParserKey;
    batchSize?: number;
  }>();

  constructor(
    @InjectRepository(Persona) private readonly personaRepo: Repository<Persona>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
  ) {
    // register available parsers
    this.parsers.set('default', new DefaultPersonaParser());
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

  /** Start import asynchronously and return a job id */
  startImport(filePath: string, parserKey: ParserKey, batchSize?: number): { jobId: string } {
    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    this.jobs.set(jobId, {
      id: jobId,
      status: 'pending',
      processed: 0,
      inserted: 0,
      failed: 0,
      total: undefined,
      startedAt: now,
      updatedAt: now,
      parser: parserKey,
      batchSize,
    });

    const parser = this.parsers.get(parserKey);
    if (!parser) throw new Error(`Unknown parser: ${parserKey}`);

    // Run in next tick to avoid blocking response
    setTimeout(async () => {
      const job = this.jobs.get(jobId);
      if (!job) return;
      job.status = 'running';
      job.updatedAt = Date.now();
      try {
        const result = await parser.parse(filePath, {
          personaRepo: this.personaRepo,
          tagRepo: this.tagRepo,
          batchSize: batchSize ?? 250,
          onProgress: (p) => {
            const j = this.jobs.get(jobId);
            if (!j) return;
            j.processed = p.processed;
            j.inserted = p.inserted;
            j.failed = p.failed;
            if (typeof p.total === 'number') j.total = p.total;
            j.updatedAt = Date.now();
          },
        });
        const j = this.jobs.get(jobId);
        if (j) {
          j.processed = result.processed;
          j.inserted = result.inserted;
          j.failed = result.failed;
          if (typeof result.total === 'number') j.total = result.total;
          j.status = 'completed';
          j.updatedAt = Date.now();
        }
      } catch (e: any) {
        const j = this.jobs.get(jobId);
        if (j) {
          j.status = 'failed';
          j.error = e?.message || String(e);
          j.updatedAt = Date.now();
        }
      } finally {
        try { await fs.unlink(filePath); } catch {}
      }
    }, 0);

    return { jobId };
  }

  getJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    return job;
  }
}
