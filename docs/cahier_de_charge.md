# EduManager — Cahier des charges v1.0 (nom du projet pas encore officiel)

## Projet

Application web SaaS multi-tenant de gestion d'établissements éducatifs.  
Stack : NestJS + Vite (React + typescript) + PostgreSQL + Redis. API REST JSON. JWT + RBAC.

### Profils d'établissement

| Profil | Type | Notes | Spécificité |
|--------|------|-------|-------------|
| P1 | École primaire, Collège, Lycée | /20, coefficient simple | Classe fixe, bulletin trimestriel |
| P2 | Lycée pro, BTS, Prépa, IUT | Contrôle continu, plusieurs notes/matière | Groupes TD/TP, calcul pondéré |
| P3 | Université, Grande École | Crédits ECTS, compensation, jury | Parcours individuel, inscription pédagogique |
| P4 | Centre de formation, école de langues | Modules courts | Sessions courtes, attestations |

Le profil est défini à la création du tenant. Il active/désactive les modules correspondants.

---

## Multi-tenancy

- Colonne `tenant_id UUID NOT NULL` sur toutes les tables métier
- `tenant_id` extrait du JWT uniquement — jamais du body ou des params
- Middleware injecte le `tenant_id` sur chaque requête authentifiée
- Suppression physique interdite sur toutes les tables métier — soft delete uniquement

```
tenants (id, name, type, profile ENUM(P1,P2,P3,P4), plan, logo_url, created_at)
```

---

## Rôles (RBAC)

| Rôle | Périmètre |
|------|-----------|
| `super_admin` | Tous les tenants (équipe technique) |
| `admin` | Gestion complète de son tenant |
| `director` | Lecture complète + validation jury (P3) |
| `teacher` | Ses classes affectées uniquement — notes + absences |
| `secretary` | Dossiers élèves, paiements, documents |
| `parent` | Lecture données de son enfant lié uniquement |
| `student` | Lecture ses données + inscription pédagogique (P3) |

Règles :
- Un enseignant ne peut saisir des notes que pour ses `teacher_assignments`
- Un utilisateur `statut=false` ne peut pas se connecter
- Un parent ne voit que les données de son enfant lié

---

## Modèle de données

### Tables principales

```sql
-- Toutes les tables ont : tenant_id, created_at, updated_at, created_by, updated_by

users (id, tenant_id, nom, prenom, email UNIQUE, telephone, role ENUM, statut BOOL, password_hash)

school_years (id, tenant_id, libelle, date_debut, date_fin, statut ENUM(active,archived))
-- Une seule année active par tenant

periods (id, tenant_id, school_year_id, libelle, type ENUM(trimestre,semestre,sequence,module), date_debut, date_fin, statut ENUM(ouvert,cloture))

classes (id, tenant_id, school_year_id, nom, niveau, type ENUM(classe,groupe_td,groupe_tp,promotion), parent_class_id, capacite, statut BOOL)
-- parent_class_id : lie un groupe TD/TP à sa classe parente (P2/P3)

subjects (id, tenant_id, nom, code, coefficient DECIMAL(4,2), credits_ects INT, type ENUM(matiere,ue,module), statut BOOL)
-- credits_ects obligatoire pour P3

subject_classes (id, tenant_id, subject_id, class_id, school_year_id)

teachers (id, tenant_id, user_id, matricule, specialite, statut BOOL)

teacher_assignments (id, tenant_id, teacher_id, class_id, subject_id, school_year_id)
-- UNIQUE(tenant_id, teacher_id, class_id, subject_id, school_year_id)

students (id, tenant_id, school_year_id, class_id, user_id, matricule, nom, prenom, sexe ENUM(M,F), date_naissance, lieu_naissance, adresse, telephone_parent, email_parent, statut BOOL)
-- UNIQUE sur (tenant_id, nom, prenom, date_naissance)

grades (id, tenant_id, school_year_id, period_id, class_id, subject_id, student_id, teacher_id, valeur DECIMAL(5,2), valeur_max DECIMAL(5,2) DEFAULT 20, type_evaluation ENUM(devoir,examen,tp,oral,cc), ponderation DECIMAL(4,2) DEFAULT 1, date_saisie, updated_at, created_by, updated_by)
-- UNIQUE(tenant_id, student_id, subject_id, period_id, type_evaluation)

absences (id, tenant_id, student_id, class_id, subject_id, date, statut ENUM(absent,retard,justifie), motif, justificatif_url, created_by)

report_cards (id, tenant_id, student_id, period_id, school_year_id, type ENUM(bulletin,releve,transcript,attestation), fichier_url, genere_le, genere_par)

fees (id, tenant_id, student_id, school_year_id, libelle, montant DECIMAL(10,2), montant_paye DECIMAL(10,2) DEFAULT 0, statut ENUM(non_paye,partiel,paye), date_echeance)

fee_payments (id, tenant_id, fee_id, montant, mode_paiement ENUM(especes,mobile_money,virement,cheque,carte), reference, recu_url, paye_le, enregistre_par)

schedules (id, tenant_id, school_year_id, class_id, subject_id, teacher_id, salle, jour ENUM(lun,mar,mer,jeu,ven,sam), heure_debut TIME, heure_fin TIME, statut ENUM(actif,annule,remplace))

audit_logs (id, tenant_id, user_id, action, resource_type, resource_id, old_value JSONB, new_value JSONB, ip_address, created_at)

-- P3 uniquement
ects_jury_results (id, tenant_id, student_id, subject_id, period_id, credits_obtenus, decision ENUM(admis,ajourne,admis_avec_dette,exclu))
student_ue_choices (id, tenant_id, student_id, subject_id, school_year_id, validated_by)
```

### Relations clés

- 1 tenant → n school_years, users, students, classes
- 1 school_year → n classes, periods
- 1 class → n students, teacher_assignments, schedules
- 1 student → n grades, absences, fees, report_cards
- 1 teacher_assignment → (teacher, class, subject, school_year)
- 1 grade → (student, subject, class, period, school_year, teacher)
- 1 fee → n fee_payments

---

## Règles métier

### Périodes
- Une note est obligatoirement liée à une période
- Aucune création/modification de note si période `cloture`
- Seul `admin` peut déverrouiller une période clôturée
- La génération de bulletin peut clôturer automatiquement la période (configurable)

### Notes
- L'enseignant connecté doit avoir un `teacher_assignment` sur (class_id, subject_id)
- Valeur entre 0 et valeur_max
- Seule valeur numérique acceptée

### Années scolaires
- Une seule année `active` par tenant
- Toutes les données métier rattachées à une année scolaire
- Année `archived` : lecture seule

### Classes
- Une classe inactive n'accepte plus de nouvelles affectations
- Groupe TD/TP lié à une classe parente via `parent_class_id`

### Élèves
- Un élève inactif reste consultable dans l'historique
- Doublon interdit sur (tenant_id, nom, prenom, date_naissance)

### Frais
- Un paiement ne peut pas dépasser le montant restant dû
- `montant_paye` mis à jour à chaque `fee_payment`

---

## Calcul des moyennes

**Commun :** arrondi 2 décimales, note max = 20 (configurable), arrondi mathématique standard.

**P1 — Note simple**
```
moyenne_matière = note unique
moyenne_générale = somme(notes) / nb_matières
si coefficient activé : somme(note × coeff) / somme(coeff)
```

**P2 — Contrôle continu**
```
moyenne_matière = somme(valeur × ponderation) / somme(ponderation)
moyenne_générale = somme(moyenne_matière × coefficient) / somme(coefficient)
```

**P3 — ECTS**
```
UE validée si moyenne_ue >= seuil (défaut 10, configurable)
crédits_obtenus = credits_ects si UE validée
compensation intrasemestre : moyenne_semestre >= 10
compensation intersemestre : moyenne_annuelle >= 10
décision jury : admis | ajourné | admis_avec_dette | exclu
```

---

## API REST

Préfixe : `/api/v1/`  
Toutes les routes sont protégées par guard RBAC.  
`tenant_id` toujours extrait du JWT.  
Pagination sur toutes les listes : `?page=&limit=`

```
# Auth
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password

# Utilisateurs
GET    /users
POST   /users
GET    /users/:id
PUT    /users/:id
PATCH  /users/:id/status
POST   /users/import

# Années scolaires
GET    /school-years
POST   /school-years
PUT    /school-years/:id
PATCH  /school-years/:id/activate

# Périodes
GET    /periods
POST   /periods
PUT    /periods/:id
POST   /periods/:id/close
POST   /periods/:id/unlock          -- admin uniquement

# Classes
GET    /classes
POST   /classes
GET    /classes/:id
PUT    /classes/:id
PATCH  /classes/:id/status
GET    /classes/:id/students
GET    /classes/:id/grades

# Matières
GET    /subjects
POST   /subjects
PUT    /subjects/:id
POST   /subjects/:id/assign-class

# Enseignants
GET    /teachers
POST   /teachers
PUT    /teachers/:id
GET    /teachers/:id/assignments
POST   /teacher-assignments
DELETE /teacher-assignments/:id

# Élèves
GET    /students
POST   /students
GET    /students/:id
PUT    /students/:id
PATCH  /students/:id/status
POST   /students/import

# Notes
GET    /grades
POST   /grades
PUT    /grades/:id
DELETE /grades/:id
POST   /grades/import
GET    /grades/averages?student_id=&period_id=
GET    /grades/class-report?class_id=&period_id=

# Absences
GET    /absences
POST   /absences
PUT    /absences/:id
GET    /absences/report?student_id=&period_id=

# Frais
GET    /fees
POST   /fees
GET    /fees/:id
POST   /fees/:id/payments
GET    /fees/unpaid
GET    /fees/report

# Emploi du temps
GET    /schedules
POST   /schedules
PUT    /schedules/:id
DELETE /schedules/:id
GET    /schedules/conflicts

# Bulletins
POST   /report-cards/generate
GET    /report-cards/:id/download
GET    /report-cards?student_id=&period_id=
POST   /report-cards/generate-batch

# Dashboard
GET    /dashboard/stats
GET    /dashboard/alerts

# Paramètres
GET    /settings
PUT    /settings
PUT    /settings/logo

# Super admin uniquement
GET    /admin/tenants
POST   /admin/tenants
PATCH  /admin/tenants/:id/status
```

---

## Validation des entrées

**Élève**
- nom, prenom, class_id, school_year_id : obligatoires
- email_parent : format email si renseigné

**Note**
- student_id, subject_id, class_id, period_id, valeur : obligatoires
- valeur : numérique, 0 ≤ valeur ≤ valeur_max
- période doit être `ouvert`
- enseignant doit avoir un teacher_assignment sur (class_id, subject_id)

**Affectation enseignant**
- teacher_id, class_id, subject_id, school_year_id : obligatoires
- combinaison (teacher_id, class_id, subject_id, school_year_id) unique

**Frais**
- student_id, montant, date_echeance : obligatoires
- paiement ≤ montant restant dû

---

## Sécurité

- bcrypt coût ≥ 12
- JWT : access token 15 min, refresh token 7 jours (stocké en base, révocable)
- Rate limiting login : 5 tentatives / 15 min / IP
- Protection CSRF si session cookie (SameSite=Strict)
- TLS 1.3 obligatoire
- Headers : HSTS, X-Frame-Options, CSP, X-Content-Type-Options
- Fichiers uploadés : vérification MIME, taille max 5 Mo
- ORM uniquement — pas de requêtes SQL brutes
- Tests d'isolation tenant : aucune requête ne doit retourner des données d'un autre tenant

---

## Journalisation

Minimum sur toutes les tables : `created_at`, `created_by`, `updated_at`, `updated_by`

Événements à journaliser dans `audit_logs` :
- Connexions (succès et échecs)
- Création, modification, suppression de notes
- Verrouillage et déverrouillage de périodes
- Génération de bulletins
- Modification des paramètres établissement
- Enregistrement de paiements
- Changement de rôle utilisateur
- Imports en masse

---

## Notifications automatiques & Temps Réel

### Architecture technique (Asynchrone)
Afin de ne jamais bloquer le fil d'exécution de l'API principale (performances), le système de notification repose sur une architecture asynchrone :
1. **EventBus (Observer)** : Lors d'une action, l'API émet un événement métier pur (ex: `AbsenceRegisteredEvent`) et retourne la réponse au client HTTP immédiatement.
2. **File d'attente (Redis + BullMQ)** : Le `NotificationService` intercepte l'événement et place la tâche de notification dans une file d'attente Redis.
3. **Workers** : Un processus en arrière-plan dépile les tâches et communique avec les fournisseurs externes pour l'envoi (FCM pour Push, SMTP pour Email, API tierce pour SMS).

### Temps Réel (WebSockets)
L'API REST reste la norme pour le CRUD standard. Les WebSockets (`@nestjs/websockets`) sont utilisés spécifiquement pour le temps réel "in-app" :
- Rafraîchissement instantané de la cloche de notification.
- Alertes critiques poussées au client (ex: annulation de cours / modification EDT).

### Grille d'envoi

| Événement | Destinataire | Canal |
|-----------|-------------|-------|
| Absence enregistrée | Parent | SMS + Push |
| Bulletin généré | Parent + Élève | Email + Push |
| Paiement en retard J+3, J+7, J+14 | Parent | SMS + Email |
| Modification EDT | Élèves concernés | Push + WebSocket |
| Seuil absences atteint | Admin + Parent | Email |

---

## Performances

| Critère | Cible | Limite |
|---------|-------|--------|
| Chargement page | < 1,5 s | < 3 s |
| Réponse API GET liste | < 200 ms | < 500 ms |
| Génération bulletin PDF | < 3 s | < 8 s |
| Génération lot 40 bulletins | < 30 s | < 90 s |
| Import CSV 500 élèves | < 10 s | < 30 s |
| Connexions simultanées/tenant | > 200 | > 50 |

Règles :
- Pagination obligatoire sur toutes les listes — pas de SELECT sans LIMIT
- Génération PDF en queue (arrière-plan) pour lots > 5 documents
- Index sur : tenant_id, school_year_id, period_id, class_id, student_id

---

## Pages frontend à implémenter

**Communes (tous profils)**
- Connexion
- Tableau de bord (adapté par rôle)
- Liste + fiche + formulaire élèves
- Classes, matières, enseignants, affectations
- Saisie des notes (par classe + matière + période)
- Absences
- Périodes
- Emploi du temps
- Frais de scolarité + enregistrement paiement
- Génération bulletins / relevés
- Paramètres établissement
- Portail parent / étudiant

**P3 uniquement**
- Inscription pédagogique (choix UE)
- Délibération et résultats jury
- Transcript académique

**Composants obligatoires**
- Tableau paginé avec tri et filtres
- Validation temps réel sur les formulaires
- Confirmation avant action irréversible
- Badge statut période : ouvert / clôturé
- Sélecteur année scolaire active persistant

---

## Phases de développement

| Phase | Durée | Profil | Livrables |
|-------|-------|--------|-----------|
| 1 | Mois 1–3 | P1 MVP | Auth, multi-tenant, élèves, notes, bulletins PDF, dashboard |
| 2 | Mois 4–6 | P1 complet | Absences, EDT, frais, espace parents, notifications |
| 3 | Mois 7–9 | P2 | Contrôle continu, groupes TD/TP, relevés semestriels |
| 4 | Mois 10–14 | P3 | ECTS, inscription pédagogique, compensation, jury, transcripts |
| 5 | Mois 15+ | Tous | Mobile, API publique, white-label, P4 |

### Critères d'acceptation MVP (Phase 1)
- Config établissement opérationnelle en < 30 min
- Import 500 élèves CSV sans erreur
- Saisie notes 40 élèves en < 10 min
- Génération bulletin PDF en < 5 s
- Lot 40 bulletins en < 60 s
- 100 connexions simultanées, temps réponse < 2 s
- Données de deux tenants distincts : zéro fuite
- Interface utilisable sur mobile sans zoom

---

## Architecture pour l'avenir : Mode Semi-Offline (Mobile/Desktop)

Pour garantir que le backend puisse supporter de futures applications mobiles ou bureaux fonctionnant hors-ligne, les principes suivants sont intégrés dès la conception :
- **Identification universelle** : Utilisation stricte d'UUIDs (`String @default(uuid())`) pour permettre la création de données hors-ligne sans risque de collision lors de la synchronisation.
- **Traçabilité temporelle** : Présence des champs `updatedAt` et `createdAt` sur toutes les tables pour identifier rapidement les deltas de données lors d'un "Pull" de synchronisation.
- **Soft Delete obligatoire** : Les suppressions sont purement logiques (champ statut/actif). Cela permet aux clients hors-ligne d'être notifiés des suppressions lors de leur reconnexion.
- **Évolutions futures (hors MVP)** : Le backend nécessitera l'ajout de routes de synchronisation dédiées (`/api/v1/sync`), la gestion des clés d'idempotence pour les requêtes (Push) et une logique de résolution de conflits (ex: Last Write Wins).