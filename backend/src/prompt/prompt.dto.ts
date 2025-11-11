import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class UpdatePromptsDto {
    @IsString()
    @IsNotEmpty()
    mainPrompt: string;

    @IsString()
    @IsNotEmpty()
    analystPrompt: string;

    // Optional Bedrock model IDs
    @IsOptional()
    @IsString()
    analystModel?: string;

    @IsOptional()
    @IsString()
    responseModel?: string;

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
    analystModel?: string | null;
    responseModel?: string | null;
    temperature: number;
}