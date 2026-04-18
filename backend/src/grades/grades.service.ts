import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PeriodTypeEnum } from '@prisma/client';
import { GradeCalculatorStrategy } from './strategies/grade-calculator.strategy';
import { TrimestrialStrategy } from './strategies/trimestrial.strategy';
import { SemestrialStrategy } from './strategies/semestrial.strategy';
import { ModuleStrategy } from './strategies/module.strategy';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createGradeDto: CreateGradeDto) {
    const grade = await this.prisma.extended.grade.create({
      data: createGradeDto as any,
    });
    
    // Pattern Observer : Notification asynchrone (ex: Email au parent)
    this.eventEmitter.emit('grade.created', grade);
    return grade;
  }

  async findAll(studentId?: string, periodId?: string) {
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (periodId) where.periodId = periodId;

    return this.prisma.extended.grade.findMany({
      where,
      include: { subject: true, teacher: { include: { user: true } } },
    });
  }

  // --- PATTERN STRATÉGIE (Calcul Dynamique) ---
  async calculateAverage(studentId: string, periodId: string): Promise<number> {
    // 1. Découverte du contexte
    const period = await this.prisma.extended.period.findUnique({
      where: { id: periodId }
    });

    if (!period) throw new BadRequestException('Période introuvable');

    // 2. Sélection de la Stratégie à la volée
    let strategy: GradeCalculatorStrategy;
    switch (period.type) {
      case PeriodTypeEnum.trimestre:
      case PeriodTypeEnum.sequence:
        strategy = new TrimestrialStrategy();
        break;
      case PeriodTypeEnum.semestre:
        strategy = new SemestrialStrategy();
        break;
      case PeriodTypeEnum.module:
        strategy = new ModuleStrategy();
        break;
      default:
        throw new BadRequestException('Type de période non supporté');
    }

    // 3. Exécution avec le contexte courant
    return strategy.calculateAverage(studentId, periodId, this.prisma);
  }
}
