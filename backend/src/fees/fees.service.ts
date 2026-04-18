import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FeeStatusEnum } from '@prisma/client';

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFeeDto: CreateFeeDto) {
    const { dateEcheance, ...rest } = createFeeDto;
    return this.prisma.extended.fee.create({
      data: { ...rest, dateEcheance: new Date(dateEcheance) } as any,
    });
  }

  async findAll(studentId?: string, schoolYearId?: string) {
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (schoolYearId) where.schoolYearId = schoolYearId;

    return this.prisma.extended.fee.findMany({
      where,
      include: { student: { select: { nom: true, prenom: true, matricule: true } } },
      orderBy: { dateEcheance: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.extended.fee.findUniqueOrThrow({
      where: { id },
      include: { student: true },
    });
  }

  async pay(id: string, montantPaye: number) {
    const fee = await this.prisma.extended.fee.findUniqueOrThrow({ where: { id } });

    const totalPaye = Number(fee.montantPaye) + montantPaye;
    const montantTotal = Number(fee.montant);

    if (totalPaye > montantTotal) {
      throw new BadRequestException(`Le montant payé (${totalPaye}) dépasse le montant total (${montantTotal})`);
    }

    // Calcul automatique du statut
    let statut: FeeStatusEnum;
    if (totalPaye >= montantTotal) {
      statut = FeeStatusEnum.paye;
    } else if (totalPaye > 0) {
      statut = FeeStatusEnum.partiel;
    } else {
      statut = FeeStatusEnum.non_paye;
    }

    return this.prisma.extended.fee.update({
      where: { id },
      data: { montantPaye: totalPaye, statut },
    });
  }

  async remove(id: string) {
    return this.prisma.extended.fee.delete({ where: { id } });
  }
}
