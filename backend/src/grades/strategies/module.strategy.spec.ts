import { ModuleStrategy } from './module.strategy';

describe('ModuleStrategy (TDD)', () => {
  let strategy: ModuleStrategy;
  let mockPrisma: any;

  beforeEach(() => {
    strategy = new ModuleStrategy();
    mockPrisma = {
      extended: {
        grade: { findMany: jest.fn() }
      }
    };
  });

  it('doit renvoyer 0 s\'il n\'y a aucune note', async () => {
    mockPrisma.extended.grade.findMany.mockResolvedValue([]);
    const average = await strategy.calculateAverage('s1', 'p1', mockPrisma);
    expect(average).toBe(0);
  });

  it('doit calculer une moyenne arithmétique simple (tous les poids égaux)', async () => {
    // Module 1 : 15/20  => 15/20 * 20 = 15
    // Module 2 : 7/10   => 7/10 * 20  = 14
    // Module 3 : 18/20  => 18/20 * 20 = 18
    // Moyenne = (15 + 14 + 18) / 3 = 47 / 3 = 15.666... => 15.67

    mockPrisma.extended.grade.findMany.mockResolvedValue([
      { valeur: 15, valeurMax: 20 },
      { valeur: 7, valeurMax: 10 },
      { valeur: 18, valeurMax: 20 },
    ]);

    const average = await strategy.calculateAverage('s1', 'p1', mockPrisma);
    expect(average).toBe(15.67);
  });

  it('doit gérer un barème inhabituel (sur 100)', async () => {
    // Note 1 : 75/100  => 75/100 * 20 = 15
    // Note 2 : 90/100  => 90/100 * 20 = 18
    // Moyenne = (15 + 18) / 2 = 16.5

    mockPrisma.extended.grade.findMany.mockResolvedValue([
      { valeur: 75, valeurMax: 100 },
      { valeur: 90, valeurMax: 100 },
    ]);

    const average = await strategy.calculateAverage('s1', 'p1', mockPrisma);
    expect(average).toBe(16.5);
  });
});
