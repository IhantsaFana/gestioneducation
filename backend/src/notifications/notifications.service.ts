import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Écoute l'événement émis par le module Students
  @OnEvent('student.registered', { async: true })
  async handleStudentRegisteredEvent(student: any) {
    this.logger.log(`Événement reçu: Inscription de l'élève ${student.nom} ${student.prenom} (Tenant: ${student.tenantId})`);
    
    // TODO: Intégration Redis/BullMQ
    this.logger.log(`[Queue Mock] Ajout d'une tâche pour envoyer un email de bienvenue...`);
  }

  // Écoute l'événement émis par le module Grades
  @OnEvent('grade.created', { async: true })
  async handleGradeCreatedEvent(grade: any) {
    this.logger.log(`Événement reçu: Nouvelle note saisie (${grade.valeur}/${grade.valeurMax}) pour l'élève ${grade.studentId}`);
    
    // TODO: Intégration Firebase Cloud Messaging (FCM) / WebSockets
    this.logger.log(`[Queue Mock] Ajout d'une tâche pour envoyer une Notification Push (Temps réel) au parent...`);
  }
}
