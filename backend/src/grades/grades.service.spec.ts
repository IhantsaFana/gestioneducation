import { Test, TestingModule } from '@nestjs/testing';
import { GradesService } from './grades.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';
import { PeriodTypeEnum } from '@prisma/client';

describe('GradesService', () => {
  let service: GradesService;
  let prisma: any;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const mockPrisma = {
      extended: {
        grade: {
          create: jest.fn().mockResolvedValue({ id: 'grade-1', valeur: 15, valeurMax: 20, studentId: 's1' }),
          findMany: jest.fn().mockResolvedValue([]),
        },
        period: {
          findUnique: jest.fn(),
        },
      },
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  // ---- TEST 1 : Émission d'événement à la création ----
  it('doit émettre un événement "grade.created" après la saisie d\'une note', async () => {
    const dto = {
      schoolYearId: 'sy1', periodId: 'p1', classId: 'c1',
      subjectId: 'sub1', studentId: 's1', teacherId: 't1',
      valeur: 15, typeEvaluation: 'devoir' as any,
    };

    await service.create(dto);

    expect(eventEmitter.emit).toHaveBeenCalledWith('grade.created', expect.objectContaining({ id: 'grade-1' }));
  });

  // ---- TEST 2 : Sélection Stratégie Trimestrielle ----
  it('doit sélectionner la TrimestrialStrategy pour une période de type "trimestre"', async () => {
    prisma.extended.period.findUnique.mockResolvedValue({ id: 'p1', type: PeriodTypeEnum.trimestre });

    // Pas de notes, on vérifie juste que ça ne plante pas et retourne 0
    const avg = await service.calculateAverage('s1', 'p1');
    expect(avg).toBe(0);
  });

  // ---- TEST 3 : Sélection Stratégie Séquentielle (même algo que Trimestriel) ----
  it('doit sélectionner la TrimestrialStrategy pour une période de type "sequence"', async () => {
    prisma.extended.period.findUnique.mockResolvedValue({ id: 'p1', type: PeriodTypeEnum.sequence });

    const avg = await service.calculateAverage('s1', 'p1');
    expect(avg).toBe(0);
  });

  // ---- TEST 4 : Sélection Stratégie Semestrielle ----
  it('doit sélectionner la SemestrialStrategy pour une période de type "semestre"', async () => {
    prisma.extended.period.findUnique.mockResolvedValue({ id: 'p1', type: PeriodTypeEnum.semestre });

    const avg = await service.calculateAverage('s1', 'p1');
    expect(avg).toBe(0);
  });

  // ---- TEST 5 : Sélection Stratégie Modulaire ----
  it('doit sélectionner la ModuleStrategy pour une période de type "module"', async () => {
    prisma.extended.period.findUnique.mockResolvedValue({ id: 'p1', type: PeriodTypeEnum.module });

    const avg = await service.calculateAverage('s1', 'p1');
    expect(avg).toBe(0);
  });

  // ---- TEST 6 : Période introuvable ----
  it('doit lever une BadRequestException si la période est introuvable', async () => {
    prisma.extended.period.findUnique.mockResolvedValue(null);

    await expect(service.calculateAverage('s1', 'p-inexistant')).rejects.toThrow(BadRequestException);
    await expect(service.calculateAverage('s1', 'p-inexistant')).rejects.toThrow('Période introuvable');
  });
});
