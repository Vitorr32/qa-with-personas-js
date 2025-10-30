import { Controller, Get, Query } from '@nestjs/common';
import { TagsService } from './tag.service';

@Controller('tags')
export class TagsController {
    constructor(private tagsService: TagsService) { }

    @Get()
    async find(
        @Query('inputQuery') inputQuery?: string,
        @Query('limit') limit?: string,
    ) {
        // Optional limit with sane bounds
        const parsedLimit = Number(limit);
        const safeLimit = Number.isFinite(parsedLimit)
            ? Math.max(1, Math.min(50, parsedLimit))
            : undefined;

        // Normalize query (defensive against 'undefined'/'null' strings)
        const normalizedQuery = (inputQuery ?? '').trim();
        const hasValidQuery = normalizedQuery.length > 0 && normalizedQuery.toLowerCase() !== 'undefined' && normalizedQuery.toLowerCase() !== 'null';

        // If the frontend provides an inputQuery (autocomplete), return matching tags.
        if (hasValidQuery) {
            return this.tagsService.findByQuery(normalizedQuery, safeLimit);
        }

        // Otherwise return a small set of most-used tags by default (e.g., 5)
        return this.tagsService.getUniqueTags(safeLimit ?? 5);
    }
}