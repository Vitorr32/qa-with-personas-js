import { IsString, IsNotEmpty } from 'class-validator';

export class UpdatePromptsDto {
    @IsString()
    @IsNotEmpty()
    mainPrompt: string;

    @IsString()
    @IsNotEmpty()
    analystPrompt: string;
}

export class PromptsResponseDto {
    id: number;
    mainPrompt: string;
    analystPrompt: string;
}