import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tag)
        private tagRepo: Repository<Tag>,
    ) { }

    async findAll(): Promise<Tag[]> {
        return this.tagRepo.find({ relations: ['personas'] });
    }

    async findByName(name: string): Promise<Tag | null> {
        return this.tagRepo.findOne({ where: { name } });
    }

    /**
     * Find tags whose name contains the provided query (case-insensitive).
     * Used by frontend autocomplete to suggest matching tags.
     */
    async findByQuery(query: string, limit?: number): Promise<Tag[]> {
        const q = query.trim().toLowerCase();
        let qb = this.tagRepo
            .createQueryBuilder('tag')
            .leftJoin('tag.personas', 'persona')
            .where('LOWER(tag.name) LIKE :q', { q: `%${q}%` })
            // Prefer tags with more usage
            .groupBy('tag.id')
            .orderBy('COUNT(persona.id)', 'DESC');

        if (limit && Number.isFinite(limit)) {
            qb = qb.limit(limit);
        }

        return qb.getMany();
    }

    async getUniqueTags(limit?: number): Promise<Tag[]> {
        // Get distinct tags used by personas, ordered by usage count desc
        let qb = this.tagRepo
            .createQueryBuilder('tag')
            .innerJoin('tag.personas', 'persona')
            .groupBy('tag.id')
            .orderBy('COUNT(persona.id)', 'DESC');

        if (limit && Number.isFinite(limit)) {
            qb = qb.limit(limit);
        }

        return qb.getMany();
    }
}