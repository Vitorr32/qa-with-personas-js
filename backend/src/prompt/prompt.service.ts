import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Prompts } from './prompt.entity';
import { PromptsResponseDto, UpdatePromptsDto } from './prompt.dto';
import { loadDefaultPrompts } from './defaults.helper';

@Injectable()
export class PromptsService {
    constructor(
        @InjectRepository(Prompts)
        private readonly promptsRepository: Repository<Prompts>,
    ) { }

    async getPromptsForUser(userId: string): Promise<PromptsResponseDto> {
        let prompts: Prompts | null = await this.promptsRepository.findOne({ where: { userId } });
        if (!prompts) {
            // Auto-create from defaults if missing
            const defaults = loadDefaultPrompts();
            const created = this.promptsRepository.create({
                userId,
                mainPrompt: defaults.mainPrompt,
                analystPrompt: defaults.analystPrompt,
                temperature: defaults.temperature,
                analystModel: null,
                responseModel: null,
            } as DeepPartial<Prompts>);
            prompts = await this.promptsRepository.save(created);
        }

        const p = prompts as Prompts;
        return {
            id: p.id,
            mainPrompt: p.mainPrompt,
            analystPrompt: p.analystPrompt,
            analystModel: (p as any).analystModel ?? null,
            responseModel: (p as any).responseModel ?? null,
            temperature: typeof (p as any).temperature === 'number' ? (p as any).temperature : 0.7,
        };
    }

    async updatePromptsForUser(userId: string, updatePromptsDto: UpdatePromptsDto): Promise<PromptsResponseDto> {
        let prompts: Prompts | null = await this.promptsRepository.findOne({ where: { userId } });
        if (!prompts) {
            // Create new row for this user
            prompts = this.promptsRepository.create({
                userId,
                mainPrompt: updatePromptsDto.mainPrompt,
                analystPrompt: updatePromptsDto.analystPrompt,
                analystModel: (updatePromptsDto as any).analystModel ?? null,
                responseModel: (updatePromptsDto as any).responseModel ?? null,
                temperature: 0.7,
            } as DeepPartial<Prompts>);
        } else {
            // Update existing row
            prompts.mainPrompt = updatePromptsDto.mainPrompt;
            prompts.analystPrompt = updatePromptsDto.analystPrompt;
            if (typeof (updatePromptsDto as any).analystModel !== 'undefined') {
                (prompts as any).analystModel = (updatePromptsDto as any).analystModel || null;
            }
            if (typeof (updatePromptsDto as any).responseModel !== 'undefined') {
                (prompts as any).responseModel = (updatePromptsDto as any).responseModel || null;
            }
        }

        // Coerce and clamp temperature server-side to be safe
        const temp = Math.max(
            0.1,
            Math.min(2, Number((updatePromptsDto as any).temperature ?? (prompts as any).temperature ?? 0.7)),
        );
        (prompts as any).temperature = temp;

        const savedPrompts = await this.promptsRepository.save(prompts as Prompts);

        return {
            id: savedPrompts.id,
            mainPrompt: savedPrompts.mainPrompt,
            analystPrompt: savedPrompts.analystPrompt,
            analystModel: (savedPrompts as any).analystModel ?? null,
            responseModel: (savedPrompts as any).responseModel ?? null,
            temperature: (savedPrompts as any).temperature ?? 0.7,
        };
    }
}