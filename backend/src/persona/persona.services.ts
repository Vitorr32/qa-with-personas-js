import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from './persona.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Tag } from 'src/tag/tag.entity';
import { CreatePersonaDto, UpdatePersonaDto } from './persona.dto';

@Injectable()
export class PersonasService {
    private readonly avatarDir = path.join(process.cwd(), 'uploads', 'avatars');

    constructor(
        @InjectRepository(Persona)
        private personaRepo: Repository<Persona>,
        @InjectRepository(Tag)
        private tagRepo: Repository<Tag>,
    ) {
        this.initializeUploadDir();
    }

    private async initializeUploadDir() {
        try {
            await fs.access(this.avatarDir);
        } catch {
            await fs.mkdir(this.avatarDir, { recursive: true });
        }
    }

    async create(createPersonaDto: CreatePersonaDto, avatarFile?: Express.Multer.File): Promise<Persona> {
        let avatarPath: string | null = null;

        if (avatarFile) {
            avatarPath = await this.saveAvatar(avatarFile);
        }

        let tags: Tag[] = [];
        if (createPersonaDto.tags) {
            const tagNames = this.normalizeTagInput(createPersonaDto.tags as unknown as string | string[]);
            if (tagNames.length > 0) {
                tags = await this.getOrCreateTags(tagNames);
            }
        }

        const persona = this.personaRepo.create({
            ...createPersonaDto,
            avatar: avatarPath || undefined,
            tags,
        });

        return this.personaRepo.save(persona);
    }

    async findAll(): Promise<Persona[]> {
        return this.personaRepo.find({ relations: ['tags'] });
    }

    /**
     * Search personas by matching the query against name, greeting or description.
     * Case-insensitive substring match. Returns at most `limit` results (default 20).
     */
    async findByQuery(query: string): Promise<Persona[]> {
        const q = `%${query.trim().toLowerCase()}%`;
        return this.personaRepo
            .createQueryBuilder('persona')
            .leftJoinAndSelect('persona.tags', 'tag')
            .where('LOWER(persona.name) LIKE :q', { q })
            .orWhere('LOWER(persona.greeting) LIKE :q', { q })
            .orWhere('LOWER(persona.description) LIKE :q', { q })
            .getMany();
    }

    /**
     * Cursor-based pagination. Returns items in descending order by createdAt,id.
     * Cursor format (opaque string): `${createdAt.toISOString()}|${id}`
     */
    async findCursorPaged(
        pageSize = 20,
        cursor?: string,
        inputQuery?: string,
        tagNames?: string[],
    ): Promise<{ items: Persona[]; nextCursor?: string; hasMore: boolean }> {
        const qb = this.personaRepo.createQueryBuilder('persona').leftJoinAndSelect('persona.tags', 'tag');

        // Search filter
        if (inputQuery && inputQuery.trim().length > 0) {
            const q = `%${inputQuery.trim().toLowerCase()}%`;
            qb.andWhere(
                '(LOWER(persona.name) LIKE :q OR LOWER(persona.greeting) LIKE :q OR LOWER(persona.description) LIKE :q)',
                { q },
            );
        }

        // Tag filter (match any of the provided tag names)
        if (tagNames && tagNames.length > 0) {
            qb.andWhere('tag.name IN (:...tagNames)', { tagNames });
        }

        // Ordering: newest first. Use createdAt + id for a stable cursor.
        qb.orderBy('persona.createdAt', 'DESC').addOrderBy('persona.id', 'DESC');

        // Apply cursor if provided. Cursor format: ISODate|id
        if (cursor) {
            const parts = cursor.split('|');
            if (parts.length === 2) {
                const cursorDate = new Date(parts[0]);
                const cursorId = parts[1];
                // For DESC ordering, we want records strictly before the cursor
                qb.andWhere(
                    '(persona.createdAt < :cursorDate OR (persona.createdAt = :cursorDate AND persona.id < :cursorId))',
                    { cursorDate, cursorId },
                );
            }
        }

        // Fetch one extra record to determine if there's a next page
        const take = Math.max(1, Math.min(500, pageSize));
        const raw = await qb.take(take + 1).getMany();

        const hasMore = raw.length > take;
        const items = raw.slice(0, take);

        let nextCursor: string | undefined = undefined;
        if (hasMore && items.length > 0) {
            const last = items[items.length - 1];
            nextCursor = `${last.createdAt.toISOString()}|${last.id}`;
        }

        return { items, nextCursor, hasMore };
    }

    async findOne(id: string): Promise<Persona> {
        const persona = await this.personaRepo.findOne({ where: { id }, relations: ['tags'] });
        if (!persona) {
            throw new NotFoundException(`Persona with ID ${id} not found`);
        }
        return persona;
    }

    async update(id: string, updatePersonaDto: UpdatePersonaDto, avatarFile?: Express.Multer.File): Promise<Persona> {
        const persona = await this.findOne(id);

        if (avatarFile) {
            if (persona.avatar) {
                await this.deleteAvatar(persona.avatar);
            }
            persona.avatar = await this.saveAvatar(avatarFile);
        }

        if (updatePersonaDto.tags) {
            const tagNames = this.normalizeTagInput(updatePersonaDto.tags as unknown as string | string[]);
            persona.tags = await this.getOrCreateTags(tagNames);
        }

        Object.assign(persona, updatePersonaDto);
        return this.personaRepo.save(persona);
    }

    async remove(id: string): Promise<void> {
        const persona = await this.findOne(id);
        if (persona.avatar) {
            await this.deleteAvatar(persona.avatar);
        }
        await this.personaRepo.remove(persona);
    }

    private async saveAvatar(file: Express.Multer.File): Promise<string> {
        const fileName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        const filePath = path.join(this.avatarDir, fileName);
        await fs.writeFile(filePath, file.buffer);
        return path.join('uploads', 'avatars', fileName);
    }

    private async deleteAvatar(avatarPath: string): Promise<void> {
        try {
            const fullPath = path.join(process.cwd(), avatarPath);
            await fs.unlink(fullPath);
        } catch (error) {
            console.warn(`Failed to delete avatar: ${avatarPath}`, error);
        }
    }

    private async getOrCreateTags(tagNames: string[]): Promise<Tag[]> {
        const tags: Tag[] = [];
        for (const name of tagNames) {
            let tag = await this.tagRepo.findOne({ where: { name } });
            if (!tag) {
                tag = this.tagRepo.create({ name });
                await this.tagRepo.save(tag);
            }
            tags.push(tag);
        }
        return tags;
    }

    /**
     * Normalize tag input coming from the frontend. The frontend may send tags as:
     * - an array of strings
     * - a JSON string representing an array (FormData sends strings)
     * - a single comma-separated string
     * This function returns a string[] with trimmed, non-empty values.
     */
    private normalizeTagInput(input: string | string[]): string[] {
        if (!input) return [];

        let arr: string[] = [];
        if (Array.isArray(input)) {
            arr = input as string[];
        } else if (typeof input === 'string') {
            const s = input.trim();
            // Try JSON parse first (e.g., FormData sends '["a","b"]')
            if ((s.startsWith('[') && s.endsWith(']')) || s.startsWith('{')) {
                try {
                    const parsed = JSON.parse(s);
                    if (Array.isArray(parsed)) {
                        arr = parsed.map(String);
                    } else {
                        // not an array, fallback to splitting
                        arr = [String(parsed)];
                    }
                } catch (err) {
                    // fall through to comma-split
                    arr = s.split(',');
                }
            } else {
                arr = s.split(',');
            }
        }

        return arr
            .map((t) => (t || '').toString().trim())
            .filter((t) => t.length > 0);
    }
}