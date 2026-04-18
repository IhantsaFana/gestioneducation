import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateSchoolYearDto } from './dto/create-school-year.dto';
import { UpdateSchoolYearDto } from './dto/update-school-year.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StatusEnum } from '@prisma/client';

@Injectable()
export class SchoolYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSchoolYearDto: CreateSchoolYearDto) {
    const { libelle, dateDebut, dateFin, statut } = createSchoolYearDto;

    if (new Date(dateDebut) >= new Date(dateFin)) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    // Utilisation d'une transaction pour s'assurer qu'une seule année est active
    return this.prisma.extended.$transaction(async (tx) => {
      if (!statut || statut === StatusEnum.active) {
        await tx.schoolYear.updateMany({
          where: { statut: StatusEnum.active },
          data: { statut: StatusEnum.archived },
        });
      }

      return tx.schoolYear.create({
        data: {
          libelle,
          dateDebut: new Date(dateDebut),
          dateFin: new Date(dateFin),
          statut: statut || StatusEnum.active,
        } as any, // 'as any' car tenantId sera injecté automatiquement par l'extension Prisma
      });
    });
  }

  async findAll() {
    return this.prisma.extended.schoolYear.findMany({
      orderBy: { dateDebut: 'desc' }
    });
  }

  async findOne(id: string) {
    return this.prisma.extended.schoolYear.findUniqueOrThrow({
      where: { id }
    });
  }

  async update(id: string, updateSchoolYearDto: UpdateSchoolYearDto) {
    return this.prisma.extended.schoolYear.update({
      where: { id },
      data: updateSchoolYearDto as any,
    });
  }

  async activate(id: string) {
    return this.prisma.extended.$transaction(async (tx) => {
      // Désactiver toutes les autres
      await tx.schoolYear.updateMany({
        where: { statut: StatusEnum.active },
        data: { statut: StatusEnum.archived },
      });
      
      // Activer celle-ci
      return tx.schoolYear.update({
        where: { id },
        data: { statut: StatusEnum.active },
      });
    });
  }

  async remove(id: string) {
    // Soft delete : on archive simplement l'année
    return this.prisma.extended.schoolYear.update({
      where: { id },
      data: { statut: StatusEnum.archived }
    });
  }
}
