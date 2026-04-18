import { SemestrialStrategy } from './semestrial.strategy';

describe('SemestrialStrategy (TDD)', () => {
  let strategy: SemestrialStrategy;
  let mockPrisma: any;

  beforeEach(() => {
    strategy = new SemestrialStrategy();
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

  it('doit calculer la moyenne avec les Crédits ECTS', async () => {
    // UE1 - Algorithmique : 14/20, 6 ECTS
    // UE2 - Base de données : 16/20, 4 ECTS
    // Moyenne attendue = (14*6 + 16*4) / (6+4) = (84+64)/10 = 148/10 = 14.8

    mockPrisma.extended.grade.findMany.mockResolvedValue([
      { valeur: 14, valeurMax: 20, ponderation: 1, subject: { coefficient: 3, creditsEcts: 6 } },
      { valeur: 16, valeurMax: 20, ponderation: 1, subject: { coefficient: 2, creditsEcts: 4 } },
    ]);

    const average = await strategy.calculateAverage('s1', 'p1', mockPrisma);
    expect(average).toBe(14.8);
  });

  it('doit utiliser le coefficient si creditsEcts est null', async () => {
    // Matière sans ECTS (ex: ancien système), Coef 5 : 12/20
    // Matière sans ECTS, Coef 3 : 18/20
    // Moyenne = (12*5 + 18*3) / (5+3) = (60+54)/8 = 114/8 = 14.25

    mockPrisma.extended.grade.findMany.mockResolvedValue([
      { valeur: 12, valeurMax: 20, ponderation: 1, subject: { coefficient: 5, creditsEcts: null } },
      { valeur: 18, valeurMax: 20, ponderation: 1, subject: { coefficient: 3, creditsEcts: null } },
    ]);

    const average = await strategy.calculateAverage('s1', 'p1', mockPrisma);
    expect(average).toBe(14.25);
  });
});
