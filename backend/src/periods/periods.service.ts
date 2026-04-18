import { Injectable, BadRequestException } from '@nestjs/common';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PeriodStatusEnum } from '@prisma/client';

@Injectable()
export class PeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPeriodDto: CreatePeriodDto) {
    const { dateDebut, dateFin, ...rest } = createPeriodDto;

    if (new Date(dateDebut) >= new Date(dateFin)) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    return this.prisma.extended.period.create({
      data: {
        ...rest,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
      } as any,
    });
  }

  async findAll(schoolYearId?: string) {
    const where: any = {};
    if (schoolYearId) where.schoolYearId = schoolYearId;

    return this.prisma.extended.period.findMany({
      where,
      orderBy: { dateDebut: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.extended.period.findUniqueOrThrow({ where: { id } });
  }

  async update(id: string, updatePeriodDto: UpdatePeriodDto) {
    return this.prisma.extended.period.update({
      where: { id },
      data: updatePeriodDto as any,
    });
  }

  async cloturer(id: string) {
    return this.prisma.extended.period.update({
      where: { id },
      data: { statut: PeriodStatusEnum.cloture },
    });
  }

  async remove(id: string) {
    return this.prisma.extended.period.delete({ where: { id } });
  }
}
