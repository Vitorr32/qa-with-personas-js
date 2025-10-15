import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tag.service';

@Controller('tags')
export class TagsController {
    constructor(private tagsService: TagsService) { }

    @Get()
    findAll() {
        return this.tagsService.getUniqueTags();
    }
}