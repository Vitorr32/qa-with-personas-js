import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { DatasetParser, ImportContext, ImportProgress } from './parser.interface';
import { Persona } from '../../persona/persona.entity';
import { Tag } from '../../tag/tag.entity';

// CSV row shape based on provided sample
interface CSVPersonaRow {
  uuid: string;
  persona: string;
  cultural_background: string;
  skills_and_expertise_list: string; // JSON-like string array
  hobbies_and_interests_list: string; // JSON-like string array
  career_goals_and_ambitions: string;
  sex: string;
  age: string;
  marital_status: string;
  education_level: string;
  occupation: string;
  region: string;
  prefecture: string;
  country: string;
}

export class CsvPersonaV1Parser implements DatasetParser {
  async parse(filePath: string, ctx: ImportContext): Promise<ImportProgress> {
    const batchSize = Math.max(1, ctx.batchSize ?? 250);
    const progress: ImportProgress = { processed: 0, inserted: 0, failed: 0 };

    // Simple in-memory tag cache to reduce lookups
    const tagCache = new Map<string, Tag>();

    const stream = createReadStream(filePath);
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const personasBatch: Persona[] = [];

    const flushBatch = async () => {
      if (personasBatch.length === 0) return;
      try {
        await ctx.personaRepo.save(personasBatch);
        progress.inserted += personasBatch.length;
      } catch (e) {
        // If batch fails, count them as failed but continue
        progress.failed += personasBatch.length;
      } finally {
        personasBatch.length = 0;
      }
    };

    return new Promise<ImportProgress>((resolve, reject) => {
      parser.on('readable', async () => {
        let record: CSVPersonaRow | null;
        // eslint-disable-next-line no-cond-assign
        while ((record = parser.read())) {
          if (ctx.signal?.aborted) {
            parser.destroy(new Error('Import aborted'));
            return;
          }
          try {
            const persona = await this.transformRow(record!, ctx, tagCache);
            personasBatch.push(persona);
          } catch (err) {
            progress.failed += 1;
          }

          progress.processed += 1;
          if (ctx.onProgress && progress.processed % 1000 === 0) ctx.onProgress({ ...progress });

          if (personasBatch.length >= batchSize) {
            // Pause stream while flushing to DB to avoid backpressure issues
            parser.pause();
            try {
              await flushBatch();
            } finally {
              parser.resume();
            }
          }
        }
      });

      parser.on('error', (err) => {
        reject(err);
      });

      parser.on('end', async () => {
        try {
          await flushBatch();
          resolve(progress);
        } catch (e) {
          reject(e);
        }
      });

      stream.pipe(parser);
    });
  }

  private async transformRow(row: CSVPersonaRow, ctx: ImportContext, tagCache: Map<string, Tag>): Promise<Persona> {
    const p = new Persona();
    // Use provided UUID to ensure idempotent imports
    if (row.uuid) (p as any).id = row.uuid;
    p.name = this.extractName(row.persona);
    p.greeting = this.generateGreeting(row, p.name);
    p.description = this.generateDescription(row);
    p.avatar = undefined;
    p.tags = await this.extractTags(row, ctx, tagCache);
    return p;
  }

  private extractName(personaText: string): string {
    if (!personaText) return 'Unknown';
    // Normalize whitespace (convert full-width spaces to normal space, collapse repeats)
    const normalized = personaText.replace(/[\u3000]+/g, ' ').replace(/\s+/g, ' ').trim();

    // 1) Try strict pattern: Two tokens (allowing Japanese middle dot) followed by は|が
    let m = normalized.match(/^([^\s、，。\.]+?)[\s]+([^\s、，。\.]+?)\s*(?:は|が)/u);
    if (m && m[1] && m[2]) {
      const candidate = `${m[1]} ${m[2]}`.trim();
      if (this.isReasonableName(candidate)) return candidate;
    }

    // 2) Try minimal capture up to the first は|が (prefer those followed by punctuation)
    m = normalized.match(/^(.*?)(?:は|が)(?:[、，。,．]|\s|$)/u);
    if (m && m[1]) {
      const candidate = this.cleanCandidate(m[1]);
      if (this.isReasonableName(candidate)) return candidate;
    }

    // 3) Fallback: take first two space-separated tokens
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      const candidate = `${tokens[0]} ${tokens[1]}`;
      if (this.isReasonableName(candidate)) return candidate;
      // As a last resort, clamp length
      return this.clamp(candidate, 40);
    }

    // 4) Last resort: first token clamped
    if (tokens.length === 1) return this.clamp(tokens[0], 40);
    return 'Unknown';
  }

  private cleanCandidate(s: string): string {
    return s.replace(/[\s、，。\.]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private isReasonableName(s: string): boolean {
    if (!s) return false;
    const tooLong = s.length > 40;
    // If it looks like a sentence/greeting, reject
    const hasSentenceMarkers = /歳|在住|です|。|【|】/.test(s);
    return !tooLong && !hasSentenceMarkers;
  }

  private clamp(s: string, max: number): string { return s.length > max ? s.slice(0, max) : s; }

  private generateGreeting(row: CSVPersonaRow, extractedName?: string): string {
    const name = (extractedName && this.clamp(extractedName, 40)) || this.extractName(row.persona);
    const age = (row.age ?? '').toString().trim();
    const occupation = (row.occupation ?? '').toString().trim();
    const prefecture = (row.prefecture ?? '').toString().trim();
    const agePart = age ? `${age}歳の` : '';
    const locationPart = prefecture ? `${prefecture}在住の` : '';
    const occPart = occupation || '';
    return `${name}は${agePart}${locationPart}${occPart}です。`;
  }

  private generateDescription(row: CSVPersonaRow): string {
    const parts = [
      row.persona ?? '',
      `\n\n【文化背景】\n${row.cultural_background ?? ''}`,
      `\n\n【キャリア目標】\n${row.career_goals_and_ambitions ?? ''}`,
    ];
    return parts.join('');
  }

  private async extractTags(row: CSVPersonaRow, ctx: ImportContext, tagCache: Map<string, Tag>): Promise<Tag[]> {
    const tagNames = new Set<string>();

    // demographics
    if (row.sex) tagNames.add(row.sex === '男' ? 'Male' : 'Female');
    const ageNum = parseInt((row.age || '').toString(), 10);
    if (!Number.isNaN(ageNum)) tagNames.add(this.getAgeGroup(ageNum));
    if (row.marital_status) tagNames.add(row.marital_status);
    if (row.education_level) tagNames.add(row.education_level);

    // location
    if (row.region) tagNames.add(row.region);
    if (row.prefecture) tagNames.add(row.prefecture);

    // occupation category
    if (row.occupation) tagNames.add(this.categorizeOccupation(row.occupation));

    // skills and hobbies
    this.parseListField(row.skills_and_expertise_list).slice(0, 5).forEach((s) => tagNames.add(s));
    this.parseListField(row.hobbies_and_interests_list).slice(0, 5).forEach((h) => tagNames.add(h));

  const tags: Tag[] = [];
    for (const name of tagNames) {
      if (!name) continue;
      let tag = tagCache.get(name);
      if (!tag) {
        let found: Tag | null = await ctx.tagRepo.findOne({ where: { name } });
        if (!found) {
          found = await ctx.tagRepo.save(ctx.tagRepo.create({ name }));
        }
        tag = found;
        tagCache.set(name, tag);
      }
      tags.push(tag);
    }
    return tags;
  }

  private parseListField(field?: string): string[] {
    if (!field) return [];
    try {
      const normalized = field.replace(/'/g, '"');
      const parsed = JSON.parse(normalized);
      return Array.isArray(parsed) ? parsed.map((s) => String(s)) : [];
    } catch {
      return [];
    }
  }

  private getAgeGroup(age: number): string {
    if (age < 25) return '20s-early';
    if (age < 35) return '20s-30s';
    if (age < 45) return '30s-40s';
    if (age < 55) return '40s-50s';
    if (age < 65) return '50s-60s';
    return 'Senior';
  }

  private categorizeOccupation(occupation: string): string {
    const categories: Record<string, string> = {
      '介護': 'Healthcare',
      '郵便': 'Postal-service',
      '製造': 'Manufacturing',
      '農業': 'Agriculture',
      '小売': 'Retail',
      '情報': 'IT-services',
      '遊技': 'Entertainment',
      '美容': 'Beauty-services',
    };
    for (const [k, v] of Object.entries(categories)) {
      if (occupation.includes(k)) return v;
    }
    return 'Other Occupation';
  }
}
