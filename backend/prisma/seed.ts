import 'dotenv/config';
import { PrismaClient, ProfileEnum, PlanEnum, RoleEnum, StatusEnum, PeriodTypeEnum, PeriodStatusEnum, EvalTypeEnum } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Début du seeding...');

  // =========================================================
  // 1. TENANT (Établissement de démonstration)
  // =========================================================
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Lycée Andohalo',
      profile: ProfileEnum.P1,
      plan: PlanEnum.BASIC,
      active: true,
    }
  });
  console.log(`✅ Tenant créé: ${tenant.name} (${tenant.id})`);

  // =========================================================
  // 2. UTILISATEURS
  // =========================================================
  const passwordHash = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      nom: 'Rakoto',
      prenom: 'Jean',
      email: 'admin@andohalo.mg',
      telephone: '+261 34 00 000 01',
      role: RoleEnum.admin,
      passwordHash,
    }
  });
  console.log(`✅ Admin créé: ${adminUser.email}`);

  const teacherUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      nom: 'Razafy',
      prenom: 'Marie',
      email: 'marie.razafy@andohalo.mg',
      telephone: '+261 34 00 000 02',
      role: RoleEnum.teacher,
      passwordHash: await bcrypt.hash('prof123', 10),
    }
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      nom: 'Andria',
      prenom: 'Luc',
      email: 'luc.andria@andohalo.mg',
      telephone: '+261 34 00 000 03',
      role: RoleEnum.teacher,
      passwordHash: await bcrypt.hash('prof123', 10),
    }
  });
  console.log(`✅ 2 Enseignants créés`);

  // =========================================================
  // 3. ANNÉE SCOLAIRE
  // =========================================================
  const schoolYear = await prisma.schoolYear.create({
    data: {
      tenantId: tenant.id,
      libelle: '2025-2026',
      dateDebut: new Date('2025-09-01'),
      dateFin: new Date('2026-06-30'),
      statut: StatusEnum.active,
    }
  });
  console.log(`✅ Année scolaire: ${schoolYear.libelle}`);

  // =========================================================
  // 4. PÉRIODES (3 Trimestres)
  // =========================================================
  const trimestre1 = await prisma.period.create({
    data: {
      tenantId: tenant.id,
      schoolYearId: schoolYear.id,
      libelle: 'Trimestre 1',
      type: PeriodTypeEnum.trimestre,
      statut: PeriodStatusEnum.cloture,
      dateDebut: new Date('2025-09-01'),
      dateFin: new Date('2025-12-15'),
    }
  });
  const trimestre2 = await prisma.period.create({
    data: {
      tenantId: tenant.id,
      schoolYearId: schoolYear.id,
      libelle: 'Trimestre 2',
      type: PeriodTypeEnum.trimestre,
      statut: PeriodStatusEnum.ouvert,
      dateDebut: new Date('2026-01-05'),
      dateFin: new Date('2026-03-31'),
    }
  });
  const trimestre3 = await prisma.period.create({
    data: {
      tenantId: tenant.id,
      schoolYearId: schoolYear.id,
      libelle: 'Trimestre 3',
      type: PeriodTypeEnum.trimestre,
      statut: PeriodStatusEnum.ouvert,
      dateDebut: new Date('2026-04-14'),
      dateFin: new Date('2026-06-30'),
    }
  });
  console.log(`✅ 3 Trimestres créés`);

  // =========================================================
  // 5. CLASSES
  // =========================================================
  const classeTermD = await prisma.class.create({
    data: {
      tenantId: tenant.id,
      schoolYearId: schoolYear.id,
      nom: 'Terminale D',
      niveau: 'Terminale',
      capacite: 35,
    }
  });
  const classeSecondeA = await prisma.class.create({
    data: {
      tenantId: tenant.id,
      schoolYearId: schoolYear.id,
      nom: 'Seconde A',
      niveau: 'Seconde',
      capacite: 40,
    }
  });
  console.log(`✅ 2 Classes créées: ${classeTermD.nom}, ${classeSecondeA.nom}`);

  // =========================================================
  // 6. MATIÈRES
  // =========================================================
  const maths = await prisma.subject.create({
    data: { tenantId: tenant.id, nom: 'Mathématiques', code: 'MATH', coefficient: 4 }
  });
  const physique = await prisma.subject.create({
    data: { tenantId: tenant.id, nom: 'Physique-Chimie', code: 'PC', coefficient: 3 }
  });
  const svt = await prisma.subject.create({
    data: { tenantId: tenant.id, nom: 'SVT', code: 'SVT', coefficient: 3 }
  });
  const francais = await prisma.subject.create({
    data: { tenantId: tenant.id, nom: 'Français', code: 'FR', coefficient: 2 }
  });
  const anglais = await prisma.subject.create({
    data: { tenantId: tenant.id, nom: 'Anglais', code: 'ANG', coefficient: 2 }
  });
  console.log(`✅ 5 Matières créées`);

  // =========================================================
  // 7. ENSEIGNANTS (profil Teacher lié aux Users)
  // =========================================================
  const teacher1 = await prisma.teacher.create({
    data: {
      tenantId: tenant.id,
      userId: teacherUser.id,
      matricule: 'ENS-001',
      specialite: 'Mathématiques / Physique',
    }
  });
  const teacher2 = await prisma.teacher.create({
    data: {
      tenantId: tenant.id,
      userId: teacherUser2.id,
      matricule: 'ENS-002',
      specialite: 'SVT / Français',
    }
  });
  console.log(`✅ 2 Profils enseignants créés`);

  // =========================================================
  // 8. AFFECTATIONS (TeacherAssignment)
  // =========================================================
  await prisma.teacherAssignment.create({
    data: {
      tenantId: tenant.id,
      teacherId: teacher1.id,
      classId: classeTermD.id,
      subjectId: maths.id,
      schoolYearId: schoolYear.id,
    }
  });
  await prisma.teacherAssignment.create({
    data: {
      tenantId: tenant.id,
      teacherId: teacher1.id,
      classId: classeTermD.id,
      subjectId: physique.id,
      schoolYearId: schoolYear.id,
    }
  });
  await prisma.teacherAssignment.create({
    data: {
      tenantId: tenant.id,
      teacherId: teacher2.id,
      classId: classeTermD.id,
      subjectId: svt.id,
      schoolYearId: schoolYear.id,
    }
  });
  console.log(`✅ 3 Affectations créées`);

  // =========================================================
  // 9. ÉLÈVES
  // =========================================================
  const eleve1 = await prisma.student.create({
    data: {
      tenantId: tenant.id,
      schoolYearId: schoolYear.id,
      classId: classeTermD.id,
      matricule: 'ELV-2026-001',
      nom: 'Rabe',
      prenom: 'Hery',
      sexe: 'M',
      dateNaissance: new Date('2007-03-15'),
      lieuNaissance: 'Antananarivo',
      telephoneParent: '+261 34 00 111 11',
    }
  });
  const eleve2 = await prisma.student.create({
    data: {
      tenantId: tenant.id,
      schoolYearId: schoolYear.id,
      classId: classeTermD.id,
      matricule: 'ELV-2026-002',
      nom: 'Rasoanaivo',
      prenom: 'Lalaina',
      sexe: 'F',
      dateNaissance: new Date('2007-08-22'),
      lieuNaissance: 'Antsirabe',
      telephoneParent: '+261 34 00 222 22',
    }
  });
  const eleve3 = await prisma.student.create({
    data: {
      tenantId: tenant.id,
      schoolYearId: schoolYear.id,
      classId: classeTermD.id,
      matricule: 'ELV-2026-003',
      nom: 'Randria',
      prenom: 'Feno',
      sexe: 'M',
      dateNaissance: new Date('2008-01-10'),
      lieuNaissance: 'Fianarantsoa',
      telephoneParent: '+261 34 00 333 33',
    }
  });
  console.log(`✅ 3 Élèves créés`);

  // =========================================================
  // 10. NOTES (Trimestre 1 - Clôturé)
  // =========================================================
  // Hery Rabe - Notes T1
  await prisma.grade.create({
    data: { tenantId: tenant.id, schoolYearId: schoolYear.id, periodId: trimestre1.id, classId: classeTermD.id, subjectId: maths.id, studentId: eleve1.id, teacherId: teacher1.id, valeur: 16, valeurMax: 20, typeEvaluation: EvalTypeEnum.devoir, ponderation: 1 }
  });
  await prisma.grade.create({
    data: { tenantId: tenant.id, schoolYearId: schoolYear.id, periodId: trimestre1.id, classId: classeTermD.id, subjectId: physique.id, studentId: eleve1.id, teacherId: teacher1.id, valeur: 14, valeurMax: 20, typeEvaluation: EvalTypeEnum.devoir, ponderation: 1 }
  });
  await prisma.grade.create({
    data: { tenantId: tenant.id, schoolYearId: schoolYear.id, periodId: trimestre1.id, classId: classeTermD.id, subjectId: svt.id, studentId: eleve1.id, teacherId: teacher2.id, valeur: 12, valeurMax: 20, typeEvaluation: EvalTypeEnum.devoir, ponderation: 1 }
  });

  // Lalaina Rasoanaivo - Notes T1
  await prisma.grade.create({
    data: { tenantId: tenant.id, schoolYearId: schoolYear.id, periodId: trimestre1.id, classId: classeTermD.id, subjectId: maths.id, studentId: eleve2.id, teacherId: teacher1.id, valeur: 18, valeurMax: 20, typeEvaluation: EvalTypeEnum.devoir, ponderation: 1 }
  });
  await prisma.grade.create({
    data: { tenantId: tenant.id, schoolYearId: schoolYear.id, periodId: trimestre1.id, classId: classeTermD.id, subjectId: physique.id, studentId: eleve2.id, teacherId: teacher1.id, valeur: 15, valeurMax: 20, typeEvaluation: EvalTypeEnum.devoir, ponderation: 1 }
  });
  await prisma.grade.create({
    data: { tenantId: tenant.id, schoolYearId: schoolYear.id, periodId: trimestre1.id, classId: classeTermD.id, subjectId: svt.id, studentId: eleve2.id, teacherId: teacher2.id, valeur: 17, valeurMax: 20, typeEvaluation: EvalTypeEnum.devoir, ponderation: 1 }
  });

  console.log(`✅ 6 Notes saisies (Trimestre 1)`);

  // =========================================================
  console.log('\n🎉 Seeding terminé avec succès !');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 Admin : admin@andohalo.mg / admin123`);
  console.log(`📧 Prof 1: marie.razafy@andohalo.mg / prof123`);
  console.log(`📧 Prof 2: luc.andria@andohalo.mg / prof123`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Erreur de seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
