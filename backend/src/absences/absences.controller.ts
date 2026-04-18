import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AbsencesService } from './absences.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { RoleEnum } from '@prisma/client';

@Controller('absences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  @Post()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.secretary)
  create(@Body() createAbsenceDto: CreateAbsenceDto) {
    return this.absencesService.create(createAbsenceDto);
  }

  @Get()
  findAll(@Query('studentId') studentId?: string, @Query('classId') classId?: string) {
    return this.absencesService.findAll(studentId, classId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.absencesService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.secretary)
  update(@Param('id') id: string, @Body() updateAbsenceDto: UpdateAbsenceDto) {
    return this.absencesService.update(id, updateAbsenceDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  remove(@Param('id') id: string) {
    return this.absencesService.remove(id);
  }
}
