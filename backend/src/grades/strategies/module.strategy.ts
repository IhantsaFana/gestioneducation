import { GradeCalculatorStrategy } from './grade-calculator.strategy';
import { PrismaService } from '../../prisma/prisma.service';

export class ModuleStrategy implements GradeCalculatorStrategy {
  async calculateAverage(studentId: string, periodId: string, prisma: PrismaService): Promise<number> {
    const grades = await prisma.extended.grade.findMany({
      where: { studentId, periodId }
    });

    if (grades.length === 0) return 0;

    let totalPoints = 0;
    
    // Dans un système modulaire pur (ex: Centre de formation), 
    // toutes les compétences ont souvent le même poids (Moyenne arithmétique)
    for (const grade of grades) {
      const noteSur20 = (Number(grade.valeur) / Number(grade.valeurMax)) * 20;
      totalPoints += noteSur20;
    }

    return Number((totalPoints / grades.length).toFixed(2));
  }
}
