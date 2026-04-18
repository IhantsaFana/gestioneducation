import { Injectable } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSubjectDto: CreateSubjectDto) {
    return this.prisma.extended.subject.create({
      data: createSubjectDto as any,
    });
  }

  async findAll() {
    return this.prisma.extended.subject.findMany({
      where: { statut: true },
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.extended.subject.findUniqueOrThrow({ where: { id } });
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    return this.prisma.extended.subject.update({
      where: { id },
      data: updateSubjectDto as any,
    });
  }

  async remove(id: string) {
    return this.prisma.extended.subject.update({
      where: { id },
      data: { statut: false },
    });
  }
}
