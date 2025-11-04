import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class UpdatePromptsDto {
    @IsString()
    @IsNotEmpty()
    mainPrompt: string;

    @IsString()
    @IsNotEmpty()
    analystPrompt: string;

    // Temperature for main prompt questions
    @IsNumber()
    @Min(0.1)
    @Max(2)
    temperature: number;
}

export class PromptsResponseDto {
    id: number;
    mainPrompt: string;
    analystPrompt: string;
    temperature: number;
}