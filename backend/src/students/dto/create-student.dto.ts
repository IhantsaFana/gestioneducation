import { IsNotEmpty, IsString, IsDateString, IsOptional, IsBoolean, IsUUID, IsEmail } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsUUID()
  schoolYearId: string;

  @IsNotEmpty()
  @IsUUID()
  classId: string;

  @IsOptional()
  @IsString()
  matricule?: string;

  @IsNotEmpty()
  @IsString()
  nom: string;

  @IsNotEmpty()
  @IsString()
  prenom: string;

  @IsNotEmpty()
  @IsString()
  sexe: string;

  @IsNotEmpty()
  @IsDateString()
  dateNaissance: string;

  @IsOptional()
  @IsString()
  lieuNaissance?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  telephoneParent?: string;

  @IsOptional()
  @IsEmail()
  emailParent?: string;

  @IsOptional()
  @IsBoolean()
  statut?: boolean;
}
