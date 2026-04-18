import { Injectable } from '@nestjs/common';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AbsencesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAbsenceDto: CreateAbsenceDto) {
    const { date, ...rest } = createAbsenceDto;
    return this.prisma.extended.absence.create({
      data: { ...rest, date: new Date(date) } as any,
    });
  }

  async findAll(studentId?: string, classId?: string) {
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;

    return this.prisma.extended.absence.findMany({
      where,
      include: { student: { select: { nom: true, prenom: true, matricule: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.extended.absence.findUniqueOrThrow({
      where: { id },
      include: { student: true },
    });
  }

  async update(id: string, updateAbsenceDto: UpdateAbsenceDto) {
    return this.prisma.extended.absence.update({
      where: { id },
      data: updateAbsenceDto as any,
    });
  }

  async remove(id: string) {
    return this.prisma.extended.absence.delete({ where: { id } });
  }
}
