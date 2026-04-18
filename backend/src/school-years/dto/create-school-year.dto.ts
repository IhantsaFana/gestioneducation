import { IsNotEmpty, IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { StatusEnum } from '@prisma/client';

export class CreateSchoolYearDto {
  @IsNotEmpty()
  @IsString()
  libelle: string;

  @IsNotEmpty()
  @IsDateString()
  dateDebut: string;

  @IsNotEmpty()
  @IsDateString()
  dateFin: string;

  @IsOptional()
  @IsEnum(StatusEnum)
  statut?: StatusEnum;
}
