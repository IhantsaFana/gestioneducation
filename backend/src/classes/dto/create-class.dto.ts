import { IsNotEmpty, IsString, IsOptional, IsInt, IsBoolean, IsUUID } from 'class-validator';

export class CreateClassDto {
  @IsNotEmpty()
  @IsUUID()
  schoolYearId: string;

  @IsNotEmpty()
  @IsString()
  nom: string;

  @IsNotEmpty()
  @IsString()
  niveau: string;

  @IsOptional()
  @IsUUID()
  parentClassId?: string;

  @IsOptional()
  @IsInt()
  capacite?: number;

  @IsOptional()
  @IsBoolean()
  statut?: boolean;
}
