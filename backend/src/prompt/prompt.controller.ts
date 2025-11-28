import { Controller, Get, Put, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { PromptsService } from './prompt.service';
import { PromptsResponseDto, UpdatePromptsDto } from './prompt.dto';

@Controller('prompts')
export class PromptsController {
    constructor(private readonly promptsService: PromptsService) { }

    @Get()
    async getPrompts(@Req() req: any): Promise<PromptsResponseDto> {
        return this.promptsService.getPromptsForUser(req.user.sub);
    }

    @Put()
    @HttpCode(HttpStatus.OK)
    async updatePrompts(
        @Req() req: any,
        @Body() updatePromptsDto: UpdatePromptsDto,
    ): Promise<PromptsResponseDto> {
        return this.promptsService.updatePromptsForUser(req.user.sub, updatePromptsDto);
    }
}