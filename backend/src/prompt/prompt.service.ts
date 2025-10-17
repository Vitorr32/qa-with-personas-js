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
        }

        const savedPrompts = await this.promptsRepository.save(prompts);

        return {
            id: savedPrompts.id,
            mainPrompt: savedPrompts.mainPrompt,
            analystPrompt: savedPrompts.analystPrompt,
        };
    }
}