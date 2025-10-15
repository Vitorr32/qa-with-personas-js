import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from './persona.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Tag } from 'src/tag/tag.entity';
import { CreatePersonaDto } from './create-persona.dto';
import { UpdatePersonaDto } from './update-persona.dto';

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
        if (createPersonaDto.tags && createPersonaDto.tags.length > 0) {
            tags = await this.getOrCreateTags(createPersonaDto.tags);
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
            persona.tags = await this.getOrCreateTags(updatePersonaDto.tags);
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
}