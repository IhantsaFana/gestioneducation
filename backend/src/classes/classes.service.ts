import { Injectable } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClassDto: CreateClassDto) {
    return this.prisma.extended.class.create({
      data: createClassDto as any, // 'as any' car tenantId sera injecté automatiquement par l'extension Prisma
    });
  }

  async findAll(schoolYearId?: string) {
    // Permet de lister toutes les classes, ou de filtrer par année scolaire
    const where = schoolYearId ? { schoolYearId } : {};
    
    return this.prisma.extended.class.findMany({
      where,
      orderBy: [
        { niveau: 'asc' },
        { nom: 'asc' }
      ]
    });
  }

  async findOne(id: string) {
    return this.prisma.extended.class.findUniqueOrThrow({
      where: { id },
      include: {
        schoolYear: true,
      }
    });
  }

  async update(id: string, updateClassDto: UpdateClassDto) {
    return this.prisma.extended.class.update({
      where: { id },
      data: updateClassDto as any,
    });
  }

  async remove(id: string) {
    // Soft Delete: on désactive la classe au lieu de la supprimer
    return this.prisma.extended.class.update({
      where: { id },
      data: { statut: false }
    });
  }
}
