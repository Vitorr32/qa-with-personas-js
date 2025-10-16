import { Controller, Get, Put, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PromptsService } from './prompt.service';
import { PromptsResponseDto, UpdatePromptsDto } from './prompt.dto';

@Controller('prompts')
export class PromptsController {
    constructor(private readonly promptsService: PromptsService) { }

    @Get()
    async getPrompts(): Promise<PromptsResponseDto> {
        return this.promptsService.getPrompts();
    }

    @Put()
    @HttpCode(HttpStatus.OK)
    async updatePrompts(
        @Body() updatePromptsDto: UpdatePromptsDto,
    ): Promise<PromptsResponseDto> {
        return this.promptsService.updatePrompts(updatePromptsDto);
    }
}