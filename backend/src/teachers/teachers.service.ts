import { Injectable } from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTeacherDto: CreateTeacherDto) {
    return this.prisma.extended.teacher.create({
      data: createTeacherDto as any,
    });
  }

  async findAll() {
    return this.prisma.extended.teacher.findMany({
      where: { statut: true },
      include: { user: { select: { nom: true, prenom: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.extended.teacher.findUniqueOrThrow({
      where: { id },
      include: {
        user: { select: { nom: true, prenom: true, email: true, telephone: true } },
        assignments: { include: { class: true, subject: true } },
      },
    });
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    return this.prisma.extended.teacher.update({
      where: { id },
      data: updateTeacherDto as any,
    });
  }

  async remove(id: string) {
    return this.prisma.extended.teacher.update({
      where: { id },
      data: { statut: false },
    });
  }
}
