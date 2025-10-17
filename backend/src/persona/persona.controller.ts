import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonasService } from './persona.services';
import { CreatePersonaDto, UpdatePersonaDto } from './persona.dto';

@Controller('personas')
export class PersonasController {
    constructor(private personasService: PersonasService) { }

    @Post()
    @UseInterceptors(FileInterceptor('avatar'))
    create(@Body() createPersonaDto: CreatePersonaDto, @UploadedFile() file?: Express.Multer.File) {
        if (file && !file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Uploaded file must be an image');
        }
        return this.personasService.create(createPersonaDto, file);
    }

    @Get()
    async find(
        @Query('pageSize') pageSizeStr?: string,
        @Query('cursor') cursor?: string,
        @Query('inputQuery') inputQuery?: string,
        @Query('tags') tags?: string,
    ) {
        // normalize pageSize
        const pageSize = pageSizeStr ? Math.max(1, Math.min(500, parseInt(pageSizeStr, 10) || 20)) : 20;

        // normalize tags: can be JSON array string or comma-separated
        let tagNames: string[] | undefined = undefined;
        if (tags) {
            try {
                const parsed = JSON.parse(tags);
                if (Array.isArray(parsed)) tagNames = parsed.map(String);
            } catch {
                tagNames = tags.split(',').map((t) => t.trim()).filter(Boolean);
            }
        }

        return this.personasService.findCursorPaged(pageSize, cursor, inputQuery, tagNames);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.personasService.findOne(id);
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('avatar'))
    update(
        @Param('id') id: string,
        @Body() updatePersonaDto: UpdatePersonaDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        if (file && !file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Uploaded file must be an image');
        }
        return this.personasService.update(id, updatePersonaDto, file);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.personasService.remove(id);
    }
}