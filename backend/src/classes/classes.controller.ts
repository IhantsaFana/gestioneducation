import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { RoleEnum } from '@prisma/client';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard) // Protection par token
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.director) // Seuls les admin et directeurs
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  // Accessible aux profs, secrétaires, etc. (sans restriction spécifique)
  // Supporte un paramètre ?schoolYearId=UUID pour filtrer
  findAll(@Query('schoolYearId') schoolYearId?: string) {
    return this.classesService.findAll(schoolYearId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.director)
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.director)
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
