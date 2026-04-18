import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateTeacherAssignmentDto {
  @IsNotEmpty()
  @IsUUID()
  teacherId: string;

  @IsNotEmpty()
  @IsUUID()
  classId: string;

  @IsNotEmpty()
  @IsUUID()
  subjectId: string;

  @IsNotEmpty()
  @IsUUID()
  schoolYearId: string;
}
