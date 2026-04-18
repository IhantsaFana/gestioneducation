import { Injectable } from '@nestjs/common';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateTeacherAssignmentDto) {
    return this.prisma.extended.teacherAssignment.create({
      data: createDto as any,
    });
  }

  async findAll(schoolYearId?: string, teacherId?: string) {
    const where: any = {};
    if (schoolYearId) where.schoolYearId = schoolYearId;
    if (teacherId) where.teacherId = teacherId;

    return this.prisma.extended.teacherAssignment.findMany({
      where,
      include: {
        teacher: { include: { user: { select: { nom: true, prenom: true } } } },
        class: { select: { nom: true, niveau: true } },
        subject: { select: { nom: true, code: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.extended.teacherAssignment.findUniqueOrThrow({
      where: { id },
      include: { teacher: { include: { user: true } }, class: true, subject: true },
    });
  }

  async remove(id: string) {
    return this.prisma.extended.teacherAssignment.delete({ where: { id } });
  }
}
