import { IsNotEmpty, IsNumber, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { EvalTypeEnum } from '@prisma/client';

export class CreateGradeDto {
  @IsNotEmpty() @IsUUID() schoolYearId: string;
  @IsNotEmpty() @IsUUID() periodId: string;
  @IsNotEmpty() @IsUUID() classId: string;
  @IsNotEmpty() @IsUUID() subjectId: string;
  @IsNotEmpty() @IsUUID() studentId: string;
  @IsNotEmpty() @IsUUID() teacherId: string;

  @IsNotEmpty() @IsNumber() valeur: number;
  @IsOptional() @IsNumber() valeurMax?: number;
  
  @IsNotEmpty() @IsEnum(EvalTypeEnum) typeEvaluation: EvalTypeEnum;
  @IsOptional() @IsNumber() ponderation?: number;
}
