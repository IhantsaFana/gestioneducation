import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeDto } from './dto/create-fee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { RoleEnum } from '@prisma/client';

@Controller('fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.secretary)
  create(@Body() createFeeDto: CreateFeeDto) {
    return this.feesService.create(createFeeDto);
  }

  @Get()
  findAll(@Query('studentId') studentId?: string, @Query('schoolYearId') schoolYearId?: string) {
    return this.feesService.findAll(studentId, schoolYearId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feesService.findOne(id);
  }

  @Patch(':id/pay')
  @Roles(RoleEnum.admin, RoleEnum.secretary)
  pay(@Param('id') id: string, @Body('montantPaye') montantPaye: number) {
    return this.feesService.pay(id, montantPaye);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  remove(@Param('id') id: string) {
    return this.feesService.remove(id);
  }
}
