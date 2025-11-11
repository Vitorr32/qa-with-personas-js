import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompts } from './prompt.entity';
import { PromptsResponseDto, UpdatePromptsDto } from './prompt.dto';

@Injectable()
export class PromptsService {
    constructor(
        @InjectRepository(Prompts)
        private readonly promptsRepository: Repository<Prompts>,
    ) { }

    async getPrompts(): Promise<PromptsResponseDto> {
        // Fetch the single prompts row. Don't assume an id value so this works
        // whether the PK is a uuid or an auto-increment integer.
        const promptsArray = await this.promptsRepository.find();
        const prompts = promptsArray[0];

        if (!prompts) {
            throw new NotFoundException('Prompts configuration not found');
        }

        return {
            id: prompts.id,
            mainPrompt: prompts.mainPrompt,
            analystPrompt: prompts.analystPrompt,
            analystModel: (prompts as any).analystModel ?? null,
            responseModel: (prompts as any).responseModel ?? null,
            temperature: typeof (prompts as any).temperature === 'number' ? (prompts as any).temperature : 0.7,
        };
    }

    async updatePrompts(updatePromptsDto: UpdatePromptsDto): Promise<PromptsResponseDto> {
        const promptsArray = await this.promptsRepository.find();
        let prompts = promptsArray[0];

        if (!prompts) {
            // Create the row if it doesn't exist. Let the database generate the id
            // (works with UUID or numeric PKs).
            prompts = this.promptsRepository.create({
                ...updatePromptsDto,
            });
        } else {
            // Update existing row
            prompts.mainPrompt = updatePromptsDto.mainPrompt;
            prompts.analystPrompt = updatePromptsDto.analystPrompt;
            // Update model selections if provided
            if (typeof (updatePromptsDto as any).analystModel !== 'undefined') {
                (prompts as any).analystModel = (updatePromptsDto as any).analystModel || null;
            }
            if (typeof (updatePromptsDto as any).responseModel !== 'undefined') {
                (prompts as any).responseModel = (updatePromptsDto as any).responseModel || null;
            }
            // Coerce and clamp temperature server-side to be safe
            const temp = Math.max(0.1, Math.min(2, Number((updatePromptsDto as any).temperature ?? (prompts as any).temperature ?? 0.7)));
            (prompts as any).temperature = temp;
        }

        const savedPrompts = await this.promptsRepository.save(prompts);

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