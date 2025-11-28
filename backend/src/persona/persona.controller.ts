import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException, Query, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonasService } from './persona.services';
import { CreatePersonaDto, UpdatePersonaDto } from './persona.dto';

@Controller('personas')
export class PersonasController {
    constructor(private personasService: PersonasService) { }

    @Post()
    @UseInterceptors(FileInterceptor('avatar'))
    create(@Body() createPersonaDto: CreatePersonaDto, @UploadedFile() file?: Express.Multer.File, @Req() req?: any) {
        if (file && !file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Uploaded file must be an image');
        }
        const creatorUserId = req?.user?.sub;
        return this.personasService.create(createPersonaDto, file, creatorUserId);
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

        // normalize tags: frontend now sends tag UUIDs (either JSON array string or comma-separated)
        let tagIds: string[] | undefined = undefined;
        if (tags) {
            try {
                const parsed = JSON.parse(tags);
                if (Array.isArray(parsed)) tagIds = parsed.map(String);
            } catch {
                tagIds = tags.split(',').map((t) => t.trim()).filter(Boolean);
            }
        }

        return this.personasService.findCursorPaged(pageSize, cursor, inputQuery, tagIds);
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

    @Delete()
    async removeMany(@Body('ids') ids?: any, @Body() body?: any) {
        // Accept various shapes: array, JSON-string, or comma-separated string
        const raw = ids ?? (body && body.ids) ?? body;

        let idArray: string[] = [];
        if (Array.isArray(raw)) {
            idArray = raw.map(String);
        } else if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) idArray = parsed.map(String);
                else idArray = String(parsed).split(',').map((s) => s.trim()).filter(Boolean);
            } catch {
                idArray = raw.split(',').map((s) => s.trim()).filter(Boolean);
            }
        } else if (raw && typeof raw === 'object') {
            const maybeIds = (raw as any).ids;
            if (Array.isArray(maybeIds)) idArray = maybeIds.map(String);
            else if (typeof maybeIds === 'string') idArray = maybeIds.split(',').map((s) => s.trim()).filter(Boolean);
        }

        if (!idArray || idArray.length === 0) {
            throw new BadRequestException('No persona IDs provided for deletion');
        }

        return this.personasService.removeMany(idArray);
    }
}