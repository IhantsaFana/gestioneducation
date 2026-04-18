import { TrimestrialStrategy } from './trimestrial.strategy';

describe('TrimestrialStrategy (TDD)', () => {
  let strategy: TrimestrialStrategy;
  let mockPrisma: any;

  beforeEach(() => {
    strategy = new TrimestrialStrategy();
    
    // Création d'un mock manuel pour PrismaService
    mockPrisma = {
      extended: {
        grade: {
          findMany: jest.fn(),
        }
      }
    };
  });

  it('doit renvoyer 0 s\'il n\'y a aucune note', async () => {
    mockPrisma.extended.grade.findMany.mockResolvedValue([]);
    const average = await strategy.calculateAverage('student-1', 'period-1', mockPrisma);
    
    expect(average).toBe(0);
    expect(mockPrisma.extended.grade.findMany).toHaveBeenCalledWith({
      where: { studentId: 'student-1', periodId: 'period-1' },
      include: { subject: true }
    });
  });

  it('doit calculer correctement la moyenne pondérée trimestrielle', async () => {
    // Cas de test complexe :
    // Note 1 : 15/20 en Math (Coef 3), Pondération de l'examen: 1 => Poids total: 3
    // Note 2 : 8/10 en Physique (soit 16/20) (Coef 2), Pondération: 2 => Poids total: 4
    
    mockPrisma.extended.grade.findMany.mockResolvedValue([
      { valeur: 15, valeurMax: 20, ponderation: 1, subject: { coefficient: 3 } },
      { valeur: 8, valeurMax: 10, ponderation: 2, subject: { coefficient: 2 } }
    ]);

    // Calcul attendu :
    // Points Note 1 : 15 * 3 = 45
    // Points Note 2 : 16 * 4 = 64
    // Total Points = 109
    // Total Poids = 3 + 4 = 7
    // Moyenne = 109 / 7 = 15.5714... (arrondi à 15.57)

    const average = await strategy.calculateAverage('student-1', 'period-1', mockPrisma);
    expect(average).toBe(15.57);
  });
});
