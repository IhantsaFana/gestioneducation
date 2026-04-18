import { GradeCalculatorStrategy } from './grade-calculator.strategy';
import { PrismaService } from '../../prisma/prisma.service';

export class SemestrialStrategy implements GradeCalculatorStrategy {
  async calculateAverage(studentId: string, periodId: string, prisma: PrismaService): Promise<number> {
    const grades = await prisma.extended.grade.findMany({
      where: { studentId, periodId },
      include: { subject: true }
    });

    if (grades.length === 0) return 0;

    let totalPoints = 0;
    let totalCredits = 0;

    for (const grade of grades) {
      const noteSur20 = (Number(grade.valeur) / Number(grade.valeurMax)) * 20;
      // Pour les semestres (LMD/Universités), on priorise souvent les Crédits ECTS
      const credit = grade.subject.creditsEcts || Number(grade.subject.coefficient);
      
      totalPoints += noteSur20 * credit;
      totalCredits += credit;
    }

    return totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
  }
}
