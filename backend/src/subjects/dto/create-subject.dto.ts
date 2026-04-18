import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsInt } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty()
  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsNotEmpty()
  @IsNumber()
  coefficient: number;

  @IsOptional()
  @IsInt()
  creditsEcts?: number;

  @IsOptional()
  @IsBoolean()
  statut?: boolean;
}
