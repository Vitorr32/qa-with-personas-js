import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreatePersonaDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    greeting: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}