import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: any;
  let eventEmitter: EventEmitter2;

  const mockStudent = {
    id: 'student-uuid-1',
    tenantId: 'tenant-uuid-1',
    nom: 'Andria',
    prenom: 'Fidy',
    sexe: 'M',
    dateNaissance: new Date('2010-05-15'),
    classId: 'class-1',
    schoolYearId: 'sy-1',
    statut: true,
  };

  beforeEach(async () => {
    const mockPrisma = {
      extended: {
        student: {
          create: jest.fn().mockResolvedValue(mockStudent),
          findMany: jest.fn().mockResolvedValue([mockStudent]),
          findUniqueOrThrow: jest.fn().mockResolvedValue(mockStudent),
          update: jest.fn().mockResolvedValue({ ...mockStudent, statut: false }),
        }
      }
    };

    const mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  // ---- TEST 1 : Création + Émission d'événement ----
  it('doit créer un élève et émettre l\'événement "student.registered"', async () => {
    const dto = {
      schoolYearId: 'sy-1', classId: 'class-1',
      nom: 'Andria', prenom: 'Fidy', sexe: 'M',
      dateNaissance: '2010-05-15',
    };

    const result = await service.create(dto);

    expect(result.nom).toBe('Andria');
    expect(eventEmitter.emit).toHaveBeenCalledWith('student.registered', expect.objectContaining({ id: 'student-uuid-1' }));
  });

  // ---- TEST 2 : Liste filtrée par classe ----
  it('doit filtrer les élèves par classId', async () => {
    await service.findAll('class-1');

    expect(prisma.extended.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ classId: 'class-1' }),
      })
    );
  });

  // ---- TEST 3 : Soft Delete ----
  it('doit désactiver l\'élève au lieu de le supprimer (soft delete)', async () => {
    const result = await service.remove('student-uuid-1');

    expect(prisma.extended.student.update).toHaveBeenCalledWith({
      where: { id: 'student-uuid-1' },
      data: { statut: false },
    });
    expect(result.statut).toBe(false);
  });
});
