import { IsNotEmpty, IsString, IsDateString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PeriodTypeEnum, PeriodStatusEnum } from '@prisma/client';

export class CreatePeriodDto {
  @IsNotEmpty()
  @IsUUID()
  schoolYearId: string;

  @IsNotEmpty()
  @IsString()
  libelle: string;

  @IsNotEmpty()
  @IsEnum(PeriodTypeEnum)
  type: PeriodTypeEnum;

  @IsOptional()
  @IsEnum(PeriodStatusEnum)
  statut?: PeriodStatusEnum;

  @IsNotEmpty()
  @IsDateString()
  dateDebut: string;

  @IsNotEmpty()
  @IsDateString()
  dateFin: string;
}
