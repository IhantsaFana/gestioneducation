import { Injectable } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    const data = {
      ...createStudentDto,
      dateNaissance: new Date(createStudentDto.dateNaissance),
    };

    const student = await this.prisma.extended.student.create({
      data: data as any, // 'as any' pour ignorer l'erreur tenantId
    });

    // Émission de l'événement pour les notifications (Pattern Observer)
    this.eventEmitter.emit('student.registered', student);

    return student;
  }

  async findAll(classId?: string, schoolYearId?: string) {
    const where: any = {};
    if (classId) where.classId = classId;
    if (schoolYearId) where.schoolYearId = schoolYearId;

    return this.prisma.extended.student.findMany({
      where,
      orderBy: [
        { nom: 'asc' },
        { prenom: 'asc' }
      ]
    });
  }

  async findOne(id: string) {
    return this.prisma.extended.student.findUniqueOrThrow({
      where: { id },
      include: {
        class: true,
        schoolYear: true,
      }
    });
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const data: any = { ...updateStudentDto };
    if (updateStudentDto.dateNaissance) {
      data.dateNaissance = new Date(updateStudentDto.dateNaissance);
    }

    return this.prisma.extended.student.update({
      where: { id },
      data: data as any,
    });
  }

  async remove(id: string) {
    return this.prisma.extended.student.update({
      where: { id },
      data: { statut: false } // Soft delete
    });
  }
}
