import { IsNotEmpty, IsOptional, IsNumber, IsString, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { FeeStatusEnum } from '@prisma/client';

export class CreateFeeDto {
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsNotEmpty()
  @IsUUID()
  schoolYearId: string;

  @IsNotEmpty()
  @IsString()
  libelle: string;

  @IsNotEmpty()
  @IsNumber()
  montant: number;

  @IsOptional()
  @IsNumber()
  montantPaye?: number;

  @IsOptional()
  @IsEnum(FeeStatusEnum)
  statut?: FeeStatusEnum;

  @IsNotEmpty()
  @IsDateString()
  dateEcheance: string;
}
