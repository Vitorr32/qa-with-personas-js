import { createReadStream } from 'fs';
import { parse as csvParse } from 'csv-parse';
import { DatasetParser, ImportContext, ImportProgress } from './parser.interface';
import { Persona } from '../../persona/persona.entity';
import { Tag } from '../../tag/tag.entity';
import * as fs from 'fs/promises';

// Generic default parser
// Accepts either:
// - CSV with columns: name, greeting, description, avatar?, tags? (tags may be JSON array string or comma-separated)
// - JSON array of { name, greeting, description, avatar?, tags?: string[] }
// - NDJSON with one JSON object per line in same shape
export class DefaultPersonaParser implements DatasetParser {
  async parse(filePath: string, ctx: ImportContext): Promise<ImportProgress> {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.json') || lower.endsWith('.ndjson')) {
      return this.parseJson(filePath, ctx);
    }
    // Try sniff first non-whitespace char to decide JSON vs CSV
    const head = await this.readHead(filePath, 1024);
    const firstChar = head.trim().charAt(0);
    if (firstChar === '[' || firstChar === '{') {
      return this.parseJson(filePath, ctx);
    }
    return this.parseCsv(filePath, ctx);
  }

  private async parseJson(filePath: string, ctx: ImportContext): Promise<ImportProgress> {
    const content = await fs.readFile(filePath, 'utf8');
    const progress: ImportProgress = { processed: 0, inserted: 0, failed: 0 };
    const tagCache = new Map<string, Tag>();

    const persistBatch = async (batch: Persona[]) => {
      if (!batch.length) return;
      try {
        await ctx.personaRepo.save(batch);
        progress.inserted += batch.length;
      } catch {
        progress.failed += batch.length;
      }
      batch.length = 0;
    };

    const batchSize = Math.max(1, ctx.batchSize ?? 250);
    const batch: Persona[] = [];

    const pushItem = async (raw: any) => {
      try {
        const persona = await this.fromRaw(raw, ctx, tagCache);
        batch.push(persona);
      } catch {
        progress.failed += 1;
      }
      progress.processed += 1;
      if (batch.length >= batchSize) await persistBatch(batch);
      if (ctx.onProgress && progress.processed % 1000 === 0) ctx.onProgress({ ...progress });
    };

    if (content.trim().startsWith('[')) {
      const arr = JSON.parse(content);
      progress.total = Array.isArray(arr) ? arr.length : undefined;
      if (ctx.onProgress) ctx.onProgress({ ...progress });
      if (!Array.isArray(arr)) throw new Error('JSON root must be an array');
      for (const item of arr) {
        // eslint-disable-next-line no-await-in-loop
        await pushItem(item);
      }
    } else {
      // NDJSON
      const lines = content.split(/\r?\n/);
      progress.total = lines.filter((l) => l.trim().length > 0).length;
      if (ctx.onProgress) ctx.onProgress({ ...progress });
      for (const line of lines) {
        const s = line.trim();
        if (!s) continue;
        // eslint-disable-next-line no-await-in-loop
        await pushItem(JSON.parse(s));
      }
    }

    await persistBatch(batch);
    if (ctx.onProgress) ctx.onProgress({ ...progress });
    return progress;
  }

  private parseCsv(filePath: string, ctx: ImportContext): Promise<ImportProgress> {
    const progress: ImportProgress = { processed: 0, inserted: 0, failed: 0 };
    const tagCache = new Map<string, Tag>();

    const stream = createReadStream(filePath);
    const parser = csvParse({ columns: true, skip_empty_lines: true, trim: true });

    const batch: Persona[] = [];
    const batchSize = Math.max(1, ctx.batchSize ?? 250);

    const flush = async () => {
      if (!batch.length) return;
      try {
        await ctx.personaRepo.save(batch);
        progress.inserted += batch.length;
      } catch {
        progress.failed += batch.length;
      } finally {
        batch.length = 0;
      }
    };

    return new Promise<ImportProgress>(async (resolve, reject) => {
      progress.total = await this.estimateTotalRows(filePath);
      if (ctx.onProgress) ctx.onProgress({ ...progress });
      parser.on('readable', async () => {
        let record: any | null;
        // eslint-disable-next-line no-cond-assign
        while ((record = parser.read())) {
          if (ctx.signal?.aborted) {
            parser.destroy(new Error('Import aborted'));
            return;
          }
          try {
            const persona = await this.fromRaw(record, ctx, tagCache);
            batch.push(persona);
          } catch {
            progress.failed += 1;
          }
          progress.processed += 1;
          if (ctx.onProgress && progress.processed % 1000 === 0) ctx.onProgress({ ...progress });
          if (batch.length >= batchSize) {
            parser.pause();
            try {
              await flush();
            } finally {
              parser.resume();
            }
          }
        }
      });

      parser.on('error', (err) => reject(err));

      parser.on('end', async () => {
        try {
          await flush();
          if (ctx.onProgress) ctx.onProgress({ ...progress });
          resolve(progress);
        } catch (e) {
          reject(e);
        }
      });

      stream.pipe(parser);
    });
  }

  private async fromRaw(raw: any, ctx: ImportContext, tagCache: Map<string, Tag>): Promise<Persona> {
    const name = this.reqString(raw.name);
    const greeting = this.reqString(raw.greeting);
    const description = this.reqString(raw.description);
    if (!name || !greeting || !description) throw new Error('Missing required fields');

    const p = new Persona();
    p.name = name;
    p.greeting = greeting;
    p.description = description;
    const avatar = this.optString(raw.avatar);
    if (avatar) p.avatar = avatar;

    const tagNames = this.parseTags(raw.tags);
    p.tags = await this.resolveTags(tagNames, ctx, tagCache);

    return p;
  }

  private parseTags(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
    const s = String(value).trim();
    if (!s) return [];
    // Try JSON array first
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v)).filter(Boolean);
    } catch {
      // not JSON
    }
    // Fallback: comma-separated
    return s.split(/[,;\|]/).map((x) => x.trim()).filter(Boolean);
  }

  private async resolveTags(names: string[], ctx: ImportContext, cache: Map<string, Tag>): Promise<Tag[]> {
    const out: Tag[] = [];
    for (const name of new Set(names)) {
      if (!name) continue;
      let tag = cache.get(name);
      if (!tag) {
        let found = await ctx.tagRepo.findOne({ where: { name } });
        if (!found) {
          found = await ctx.tagRepo.save(ctx.tagRepo.create({ name }));
        }
        tag = found;
        cache.set(name, tag);
      }
      out.push(tag);
    }
    return out;
  }

  private async readHead(filePath: string, bytes: number): Promise<string> {
    const fh = await fs.open(filePath, 'r');
    try {
      const { buffer, bytesRead } = await fh.read({ position: 0, length: bytes, buffer: Buffer.alloc(bytes) });
      return buffer.subarray(0, bytesRead).toString('utf8');
    } finally {
      await fh.close();
    }
  }

  private async estimateTotalRows(filePath: string): Promise<number | undefined> {
    try {
      const fsn = await import('fs');
      return await new Promise<number>((resolve, reject) => {
        let count = 0;
        const stream = fsn.createReadStream(filePath);
        stream.on('data', (chunk: Buffer) => {
          for (let i = 0; i < chunk.length; i++) if (chunk[i] === 10) count++; // \n
        });
        stream.on('error', (e) => reject(e));
        stream.on('end', () => {
          resolve(count > 0 ? Math.max(0, count - 1) : 0);
        });
      });
    } catch {
      return undefined;
    }
  }

  private reqString(v: any): string {
    const s = (v ?? '').toString().trim();
    return s.length ? s : '';
  }
  private optString(v: any): string | undefined {
    const s = (v ?? '').toString().trim();
    return s.length ? s : undefined;
  }
}
