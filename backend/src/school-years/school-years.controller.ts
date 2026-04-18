import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SchoolYearsService } from './school-years.service';
import { CreateSchoolYearDto } from './dto/create-school-year.dto';
import { UpdateSchoolYearDto } from './dto/update-school-year.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { RoleEnum } from '@prisma/client';

@Controller('school-years')
@UseGuards(JwtAuthGuard, RolesGuard) // Protection sur tout le contrôleur
export class SchoolYearsController {
  constructor(private readonly schoolYearsService: SchoolYearsService) {}

  @Post()
  @Roles(RoleEnum.admin) // Seul l'admin peut créer une année
  create(@Body() createSchoolYearDto: CreateSchoolYearDto) {
    return this.schoolYearsService.create(createSchoolYearDto);
  }

  @Get()
  // Accessible à tout utilisateur connecté de cet établissement
  findAll() {
    return this.schoolYearsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schoolYearsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin)
  update(@Param('id') id: string, @Body() updateSchoolYearDto: UpdateSchoolYearDto) {
    return this.schoolYearsService.update(id, updateSchoolYearDto);
  }

  @Patch(':id/activate')
  @Roles(RoleEnum.admin)
  activate(@Param('id') id: string) {
    return this.schoolYearsService.activate(id);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  remove(@Param('id') id: string) {
    return this.schoolYearsService.remove(id);
  }
}
