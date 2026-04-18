import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PeriodsService } from './periods.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { RoleEnum } from '@prisma/client';

@Controller('periods')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.director)
  create(@Body() createPeriodDto: CreatePeriodDto) {
    return this.periodsService.create(createPeriodDto);
  }

  @Get()
  findAll(@Query('schoolYearId') schoolYearId?: string) {
    return this.periodsService.findAll(schoolYearId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.periodsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.director)
  update(@Param('id') id: string, @Body() updatePeriodDto: UpdatePeriodDto) {
    return this.periodsService.update(id, updatePeriodDto);
  }

  @Patch(':id/cloturer')
  @Roles(RoleEnum.admin, RoleEnum.director)
  cloturer(@Param('id') id: string) {
    return this.periodsService.cloturer(id);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  remove(@Param('id') id: string) {
    return this.periodsService.remove(id);
  }
}
