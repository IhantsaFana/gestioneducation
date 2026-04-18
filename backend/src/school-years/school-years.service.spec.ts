import { Test, TestingModule } from '@nestjs/testing';
import { SchoolYearsService } from './school-years.service';
import { PrismaService } from '../prisma/prisma.service';
import { StatusEnum } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('SchoolYearsService', () => {
  let service: SchoolYearsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    // 1. Création d'un "Mock" (Simulacre) de la Base de Données
    const mockPrismaService = {
      extended: {
        $transaction: jest.fn().mockImplementation(async (callback) => {
          // On simule l'objet `tx` passé au callback de la transaction
          const tx = {
            schoolYear: {
              updateMany: jest.fn().mockResolvedValue({ count: 1 }), // Simule l'archivage
              create: jest.fn().mockResolvedValue({ 
                id: '123', 
                libelle: '2026-2027', 
                statut: StatusEnum.active 
              }),
            }
          };
          return callback(tx);
        })
      }
    };

    // 2. Compilation du module de test avec notre faux Prisma
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolYearsService,
        { provide: PrismaService, useValue: mockPrismaService }, 
      ],
    }).compile();

    service = module.get<SchoolYearsService>(SchoolYearsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  it('doit lever une exception si la date de fin est antérieure à la date de début', async () => {
    const badDto = {
      libelle: 'Année Impossible',
      dateDebut: '2027-01-01T00:00:00Z',
      dateFin: '2026-01-01T00:00:00Z', // ERREUR ICI
      statut: StatusEnum.active
    };

    // On s'attend à ce que le service rejette cette création avec une BadRequestException
    await expect(service.create(badDto)).rejects.toThrow(BadRequestException);
    await expect(service.create(badDto)).rejects.toThrow('La date de fin doit être postérieure à la date de début');
  });

  it('doit exécuter une transaction Prisma lors de la création', async () => {
    const goodDto = {
      libelle: '2026-2027',
      dateDebut: '2026-09-01T00:00:00Z',
      dateFin: '2027-06-30T00:00:00Z',
      statut: StatusEnum.active
    };

    const result = await service.create(goodDto);

    // On vérifie que la méthode $transaction a bien été appelée
    expect(prisma.extended.$transaction).toHaveBeenCalled();
    
    // Le résultat renvoyé par le service doit correspondre au mock
    expect(result.libelle).toBe('2026-2027');
    expect(result.statut).toBe(StatusEnum.active);
  });
});
