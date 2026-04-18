import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { RoleEnum } from '@prisma/client';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.director, RoleEnum.secretary) // Secrétaire autorisée à inscrire
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  // Accessible aux professeurs et autres membres du personnel pour lister les élèves
  findAll(@Query('classId') classId?: string, @Query('schoolYearId') schoolYearId?: string) {
    return this.studentsService.findAll(classId, schoolYearId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.director, RoleEnum.secretary)
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.director) // Seule la direction peut supprimer/archiver un élève
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
