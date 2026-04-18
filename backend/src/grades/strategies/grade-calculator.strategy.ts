import { PrismaService } from '../../prisma/prisma.service';

export interface GradeCalculatorStrategy {
  /**
   * Calcule la moyenne d'un élève pour une période donnée.
   * La formule dépendra de l'implémentation (Trimestre, Semestre, etc.)
   */
  calculateAverage(studentId: string, periodId: string, prisma: PrismaService): Promise<number>;
}
