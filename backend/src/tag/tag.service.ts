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
    async findByQuery(query: string): Promise<Tag[]> {
        const q = query.trim().toLowerCase();
        return this.tagRepo
            .createQueryBuilder('tag')
            .where('LOWER(tag.name) LIKE :q', { q: `%${q}%` })
            .leftJoinAndSelect('tag.personas', 'persona')
            .getMany();
    }

    async getUniqueTags(): Promise<Tag[]> {
        // Get all distinct tags used by personas
        const tags = await this.tagRepo
            .createQueryBuilder('tag')
            .innerJoinAndSelect('tag.personas', 'persona')
            .distinct(true)
            .getMany();
        return tags;
    }
}