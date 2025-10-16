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
        const prompts = await this.promptsRepository.findOne({
            where: { id: 1 },
        });

        if (!prompts) {
            throw new NotFoundException('Prompts configuration not found');
        }

        return {
            id: prompts.id,
            mainPrompt: prompts.mainPrompt,
            analystPrompt: prompts.analystPrompt,
        };
    }

    async updatePrompts(updatePromptsDto: UpdatePromptsDto): Promise<PromptsResponseDto> {
        let prompts = await this.promptsRepository.findOne({
            where: { id: 1 },
        });

        if (!prompts) {
            // Create the row if it doesn't exist
            prompts = this.promptsRepository.create({
                id: 1,
                ...updatePromptsDto,
            });
        } else {
            // Update existing row
            prompts.mainPrompt = updatePromptsDto.mainPrompt;
            prompts.analystPrompt = updatePromptsDto.analystPrompt;
        }

        const savedPrompts = await this.promptsRepository.save(prompts);

        return {
            id: savedPrompts.id,
            mainPrompt: savedPrompts.mainPrompt,
            analystPrompt: savedPrompts.analystPrompt,
        };
    }
}