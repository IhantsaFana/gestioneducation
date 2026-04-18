import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { RoleEnum } from '@prisma/client';

@Controller('teacher-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherAssignmentsController {
  constructor(private readonly service: TeacherAssignmentsService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.director)
  create(@Body() createDto: CreateTeacherAssignmentDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query('schoolYearId') schoolYearId?: string, @Query('teacherId') teacherId?: string) {
    return this.service.findAll(schoolYearId, teacherId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.director)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
