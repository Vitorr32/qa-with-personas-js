import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonasService } from './persona.services';
import { CreatePersonaDto } from './create-persona.dto';
import { UpdatePersonaDto } from './update-persona.dto';

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
    findAll() {
        return this.personasService.findAll();
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