import { IsNotEmpty, IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';

export class CreateAbsenceDto {
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsNotEmpty()
  @IsUUID()
  classId: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  statut: string; // absent, retard, justifie

  @IsOptional()
  @IsString()
  motif?: string;
}
