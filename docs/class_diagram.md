classDiagram mermaid
direction TB

%% ═══════════════════════════════════════════════════
%% DOMAIN CORE
%% ═══════════════════════════════════════════════════

class Tenant {
  <<Entity>>
  +UUID id
  +String name
  +ProfileEnum profile
  +PlanEnum plan
  +String logoUrl
  +Boolean active
  +getSettings() TenantSettings
}

class User {
  <<Entity>>
  +UUID id
  +UUID tenantId
  +String email
  +RoleEnum role
  +Boolean active
  +String passwordHash
  +verifyPassword(plain) Boolean
  +hasRole(role) Boolean
}

class Student {
  <<Entity>>
  +UUID id
  +UUID tenantId
  +UUID classId
  +UUID schoolYearId
  +String nom
  +String prenom
  +Date dateNaissance
  +Boolean active
  +getFullName() String
  +isEnrolledIn(classId) Boolean
}

class SchoolYear {
  <<Entity>>
  +UUID id
  +UUID tenantId
  +String libelle
  +Date dateDebut
  +Date dateFin
  +StatusEnum statut
  +isActive() Boolean
  +overlaps(other) Boolean
}

class Period {
  <<Entity>>
  +UUID id
  +UUID tenantId
  +UUID schoolYearId
  +String libelle
  +PeriodTypeEnum type
  +PeriodStatusEnum statut
  +isOpen() Boolean
  +close() void
  +unlock() void
}

class Grade {
  <<Entity>>
  +UUID id
  +UUID tenantId
  +UUID studentId
  +UUID subjectId
  +UUID periodId
  +UUID teacherId
  +Decimal valeur
  +Decimal valeurMax
  +EvalTypeEnum typeEvaluation
  +Decimal ponderation
  +validate() void
}

class Subject {
  <<Entity>>
  +UUID id
  +UUID tenantId
  +String nom
  +Decimal coefficient
  +Integer creditsEcts
  +SubjectTypeEnum type
}

class TeacherAssignment {
  <<Entity>>
  +UUID id
  +UUID tenantId
  +UUID teacherId
  +UUID classId
  +UUID subjectId
  +UUID schoolYearId
  +isAuthorizedFor(teacherId, classId, subjectId) Boolean
}

class Fee {
  <<Entity>>
  +UUID id
  +UUID tenantId
  +UUID studentId
  +Decimal montant
  +Decimal montantPaye
  +FeeStatusEnum statut
  +Date dateEcheance
  +getRemainingAmount() Decimal
  +isOverdue() Boolean
}

%% ═══════════════════════════════════════════════════
%% STRATEGY PATTERN — Calcul des moyennes
%% ═══════════════════════════════════════════════════

class IGradeCalculator {
  <<interface>>
  +calculateSubjectAverage(grades) Decimal
  +calculateGeneralAverage(subjectAvgs) Decimal
  +getDecision(average) DecisionEnum
}

class SimpleGradeCalculator {
  <<Strategy — P1>>
  +calculateSubjectAverage(grades) Decimal
  +calculateGeneralAverage(subjectAvgs) Decimal
  +getDecision(average) DecisionEnum
}

class WeightedGradeCalculator {
  <<Strategy — P2>>
  -Decimal[] ponderations
  +calculateSubjectAverage(grades) Decimal
  +calculateGeneralAverage(subjectAvgs) Decimal
  +getDecision(average) DecisionEnum
}

class EctsGradeCalculator {
  <<Strategy — P3>>
  -Decimal validationThreshold
  -Boolean intraSemesterCompensation
  -Boolean interSemesterCompensation
  +calculateSubjectAverage(grades) Decimal
  +calculateGeneralAverage(subjectAvgs) Decimal
  +getDecision(average) DecisionEnum
  +getCreditsEarned(subjectAvgs) Integer
  +applyCompensation(semResults) JuryDecision
}

class GradeCalculatorFactory {
  <<Factory>>
  +create(profile ProfileEnum) IGradeCalculator
}

%% ═══════════════════════════════════════════════════
%% STRATEGY PATTERN — Génération de documents
%% ═══════════════════════════════════════════════════

class IDocumentGenerator {
  <<interface>>
  +generate(context DocumentContext) Buffer
  +getDocumentType() DocTypeEnum
}

class BulletinGenerator {
  <<Strategy — P1/P2>>
  +generate(context DocumentContext) Buffer
  +getDocumentType() DocTypeEnum
}

class TranscriptGenerator {
  <<Strategy — P3>>
  +generate(context DocumentContext) Buffer
  +getDocumentType() DocTypeEnum
}

class AttestationGenerator {
  <<Strategy — P4>>
  +generate(context DocumentContext) Buffer
  +getDocumentType() DocTypeEnum
}

class DocumentGeneratorFactory {
  <<Factory>>
  +create(type DocTypeEnum) IDocumentGenerator
}

%% ═══════════════════════════════════════════════════
%% REPOSITORY PATTERN — Data Access
%% ═══════════════════════════════════════════════════

class IStudentRepository {
  <<interface>>
  +findById(tenantId, id) Student
  +findByClass(tenantId, classId) Student[]
  +save(student) Student
  +softDelete(tenantId, id) void
}

class ITeacherAssignmentRepository {
  <<interface>>
  +findByTeacher(tenantId, teacherId) TeacherAssignment[]
  +exists(tenantId, teacherId, classId, subjectId) Boolean
}

class IGradeRepository {
  <<interface>>
  +findByPeriod(tenantId, periodId) Grade[]
  +findByStudent(tenantId, studentId, periodId) Grade[]
  +save(grade) Grade
  +deleteIfPeriodOpen(tenantId, id) void
}

class IFeeRepository {
  <<interface>>
  +findUnpaid(tenantId) Fee[]
  +findByStudent(tenantId, studentId) Fee[]
  +save(fee) Fee
}

class PostgresStudentRepository {
  <<Repository>>
  -PrismaClient db
  +findById(tenantId, id) Student
  +findByClass(tenantId, classId) Student[]
  +save(student) Student
  +softDelete(tenantId, id) void
}

class PostgresGradeRepository {
  <<Repository>>
  -PrismaClient db
  +findByPeriod(tenantId, periodId) Grade[]
  +findByStudent(tenantId, studentId, periodId) Grade[]
  +save(grade) Grade
  +deleteIfPeriodOpen(tenantId, id) void
}

%% ═══════════════════════════════════════════════════
%% SERVICE LAYER — Business Logic
%% ═══════════════════════════════════════════════════

class GradeService {
  <<Service>>
  -IGradeRepository gradeRepo
  -ITeacherAssignmentRepository assignRepo
  -IGradeCalculator calculator
  -EventBus eventBus
  +createGrade(dto CreateGradeDto) Grade
  +updateGrade(dto UpdateGradeDto) Grade
  +deleteGrade(tenantId, id) void
  +getAverages(tenantId, studentId, periodId) AverageResult
}

class StudentService {
  <<Service>>
  -IStudentRepository studentRepo
  -EventBus eventBus
  +enroll(dto EnrollStudentDto) Student
  +assignToClass(studentId, classId) void
  +importFromCsv(tenantId, file) ImportResult
}

class ReportCardService {
  <<Service>>
  -IDocumentGenerator generator
  -IGradeCalculator calculator
  -StorageService storage
  -EventBus eventBus
  +generate(tenantId, studentId, periodId) ReportCard
  +generateBatch(tenantId, classId, periodId) Job
}

class FeeService {
  <<Service>>
  -IFeeRepository feeRepo
  -NotificationService notifService
  -EventBus eventBus
  +createFee(dto CreateFeeDto) Fee
  +recordPayment(feeId, dto PaymentDto) FeePayment
  +sendOverdueReminders(tenantId) void
}

class NotificationService {
  <<Service>>
  -INotificationChannel[] channels
  -EventBus eventBus
  +send(event DomainEvent) void
  +subscribe(eventType, handler) void
}

%% ═══════════════════════════════════════════════════
%% OBSERVER PATTERN — Domain Events
%% ═══════════════════════════════════════════════════

class DomainEvent {
  <<abstract>>
  +UUID id
  +UUID tenantId
  +DateTime occurredAt
  +String eventType
}

class AbsenceRegisteredEvent {
  <<DomainEvent>>
  +UUID studentId
  +UUID classId
  +Date date
}

class ReportCardGeneratedEvent {
  <<DomainEvent>>
  +UUID studentId
  +UUID periodId
  +String fileUrl
}

class FeeOverdueEvent {
  <<DomainEvent>>
  +UUID studentId
  +UUID feeId
  +Integer daysOverdue
}

class EventBus {
  <<Observer — Mediator>>
  -Map handlers
  +publish(event DomainEvent) void
  +subscribe(type, handler) void
  +unsubscribe(type, handler) void
}

%% ═══════════════════════════════════════════════════
%% MULTI-TENANT — Middleware / Decorator
%% ═══════════════════════════════════════════════════

class TenantContext {
  <<Decorator — Singleton>>
  -UUID tenantId
  -ProfileEnum profile
  +static get() TenantContext
  +static set(tenantId, profile) void
  +static clear() void
}

class TenantMiddleware {
  <<Middleware>>
  +use(req, res, next) void
  -extractTenantFromJwt(token) UUID
  -injectTenantContext(tenantId) void
}

%% ═══════════════════════════════════════════════════
%% RELATIONS
%% ═══════════════════════════════════════════════════

Tenant "1" --> "n" User : owns
Tenant "1" --> "n" Student : owns
Tenant "1" --> "n" SchoolYear : owns

SchoolYear "1" --> "n" Period : contains
SchoolYear "1" --> "n" Student : scopes

Period "1" --> "n" Grade : scopes
Student "1" --> "n" Grade : has
Subject "1" --> "n" Grade : for
TeacherAssignment "1" --> "n" Grade : authorizes

Student "1" --> "n" Fee : owes

IGradeCalculator <|.. SimpleGradeCalculator : implements
IGradeCalculator <|.. WeightedGradeCalculator : implements
IGradeCalculator <|.. EctsGradeCalculator : implements
GradeCalculatorFactory ..> IGradeCalculator : creates

IDocumentGenerator <|.. BulletinGenerator : implements
IDocumentGenerator <|.. TranscriptGenerator : implements
IDocumentGenerator <|.. AttestationGenerator : implements
DocumentGeneratorFactory ..> IDocumentGenerator : creates

IStudentRepository <|.. PostgresStudentRepository : implements
IGradeRepository <|.. PostgresGradeRepository : implements

GradeService --> IGradeRepository : uses
GradeService --> ITeacherAssignmentRepository : uses
GradeService --> IGradeCalculator : uses
GradeService --> EventBus : publishes

StudentService --> IStudentRepository : uses
StudentService --> EventBus : publishes

ReportCardService --> IDocumentGenerator : uses
ReportCardService --> IGradeCalculator : uses
ReportCardService --> EventBus : publishes

FeeService --> IFeeRepository : uses
FeeService --> EventBus : publishes

DomainEvent <|-- AbsenceRegisteredEvent : extends
DomainEvent <|-- ReportCardGeneratedEvent : extends
DomainEvent <|-- FeeOverdueEvent : extends

EventBus --> NotificationService : notifies
NotificationService ..> DomainEvent : handles

TenantMiddleware --> TenantContext : sets
GradeService ..> TenantContext : reads
StudentService ..> TenantContext : reads