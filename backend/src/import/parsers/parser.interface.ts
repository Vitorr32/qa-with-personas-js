import { Repository } from 'typeorm';
import { Persona } from '../../persona/persona.entity';
import { Tag } from '../../tag/tag.entity';

export type ImportProgress = {
  processed: number;
  inserted: number;
  failed: number;
};

export interface ImportContext {
  personaRepo: Repository<Persona>;
  tagRepo: Repository<Tag>;
  /** Optional batch size when persisting entities */
  batchSize?: number;
  /** Optional callback for progress updates */
  onProgress?: (progress: ImportProgress) => void;
  /** Optional AbortSignal to support cancelation */
  signal?: AbortSignal;
}

export interface DatasetParser {
  /**
   * Parse the given file and persist personas and tags.
   * Should stream/process in batches to avoid high memory usage.
   */
  parse(filePath: string, ctx: ImportContext): Promise<ImportProgress>;
}
