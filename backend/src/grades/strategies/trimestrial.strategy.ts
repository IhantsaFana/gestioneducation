import { GradeCalculatorStrategy } from './grade-calculator.strategy';
import { PrismaService } from '../../prisma/prisma.service';

export class TrimestrialStrategy implements GradeCalculatorStrategy {
  async calculateAverage(studentId: string, periodId: string, prisma: PrismaService): Promise<number> {
    const grades = await prisma.extended.grade.findMany({
      where: { studentId, periodId },
      include: { subject: true }
    });

    if (grades.length === 0) return 0;

    let totalPoints = 0;
    let totalCoeffs = 0;

    for (const grade of grades) {
      // Ramener la note sur 20 pour standardiser
      const noteSur20 = (Number(grade.valeur) / Number(grade.valeurMax)) * 20;
      // Le poids dépend du coefficient de la matière ET de la pondération de l'évaluation
      const weight = Number(grade.subject.coefficient) * Number(grade.ponderation);
      
      totalPoints += noteSur20 * weight;
      totalCoeffs += weight;
    }

    return totalCoeffs > 0 ? Number((totalPoints / totalCoeffs).toFixed(2)) : 0;
  }
}
