import { Controller, Get, Query } from '@nestjs/common';
import { TagsService } from './tag.service';

@Controller('tags')
export class TagsController {
    constructor(private tagsService: TagsService) { }

    @Get()
    async find(@Query('inputQuery') inputQuery?: string) {
        // If the frontend provides an inputQuery (autocomplete), return matching tags.
        if (inputQuery && inputQuery.trim().length > 0) {
            return this.tagsService.findByQuery(inputQuery);
        }

        // Otherwise return unique tags used by personas (existing behavior)
        return this.tagsService.getUniqueTags();
    }
}