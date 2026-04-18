import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { RoleEnum } from '@prisma/client';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.director) // Les profs saisissent les notes
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradesService.create(createGradeDto);
  }

  @Get()
  findAll(@Query('studentId') studentId?: string, @Query('periodId') periodId?: string) {
    return this.gradesService.findAll(studentId, periodId);
  }

  @Get('average/:studentId/:periodId')
  // Endpoint dédié pour exécuter la stratégie de calcul
  calculateAverage(
    @Param('studentId') studentId: string, 
    @Param('periodId') periodId: string
  ) {
    return this.gradesService.calculateAverage(studentId, periodId);
  }
}
