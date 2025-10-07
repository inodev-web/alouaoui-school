# 🗃️ Structure de la Base de Données - Alouaoui School (Version Simplifiée)

Cette version reflète la refonte : suppression du module Paiements, simplification des abonnements et clarification de la logique d'accès.

## � Tables Principales

### 👥 Users
```sql
uuid (PK)                - Clé primaire UUID
firstname                - Prénom
lastname                 - Nom
birth_date               - Date de naissance (nullable)
address                  - Adresse (nullable)
school_name              - Nom de l'établissement (nullable)
phone                    - Téléphone unique (login)
phone_verified_at        - Datetime vérification (nullable)
password                 - Hash
year_of_study            - Enum(1AM..3AS) nullable
role                     - 'admin' | 'student'
device_uuid              - UUID appareil (single device enforcement)
free_subscriber          - Bool (true si exonéré de paiement)
free_subscriber_reason   - Texte (nullable)
remember_token           - Token session
timestamps               - created_at / updated_at
```

### 👨‍🏫 Teachers
```sql
uuid (PK)
name                     - Nom affiché
module                   - Matière
year                     - Cible pédagogique
is_online_publisher      - Bool
price_subscription       - Prix abonnement mensuel (decimal 8,2)
percent_school           - Pourcentage part école
timestamps               - created_at / updated_at
```

### 📚 Chapters
```sql
id (PK)                  - Auto-incrément
title                    - Titre
description              - Text nullable
teacher_name             - Nom affiché (ex: 'Alouaoui')
year_target              - Enum année cible
timestamps               - created_at / updated_at
```

### 🎥 Courses
```sql
id (PK)
chapter_id (FK)          - Vers chapters.id
title                    - Titre
video_ref                - Chemin/clé vidéo
pdf_summary              - PDF résumé (nullable)
exercises_pdf            - PDF exercices (nullable)
year_target              - Année cible
timestamps               - created_at / updated_at
```

### 📅 Sessions
Simplifiées : uniquement notion temporelle + prix unitaire éventuel.
```sql
id (PK)
teacher_id (FK)          - Vers teachers.uuid
year_target              - Année cible
start_time               - Datetime début
end_time                 - Datetime fin
price                    - Prix (appliqué aux non abonnés) nullable
status                   - 'completed' | 'cancelled'
timestamps               - created_at / updated_at
```

### 💳 Subscriptions
Deux formes :
1. Mensuelle : starts_at = today, ends_at = +1 mois exact
2. Pass séance (éphémère) : starts_at = ends_at = today
```sql
id (PK)
user_uuid (FK)           - Vers users.uuid
teacher_uuid (FK)        - Vers teachers.uuid
starts_at                - Datetime début
ends_at                  - Datetime fin
timestamps               - created_at / updated_at
```

Statut implicite : active si NOW() entre starts_at et ends_at.

### � Attendances
```sql
id (PK)
student_uuid (FK)        - Vers users.uuid
teacher_uuid (FK)        - Vers teachers.uuid
session_id (FK)          - Vers sessions.id (nullable)
validated_at             - Datetime validation (scan / saisie)
timestamps               - created_at / updated_at
```

Classification (dérivée) :
- invité (guest) si validated_at = starts_at = ends_at d'un abonnement correspondant
- abonné si validated_at ∈ [starts_at, ends_at] d'un abonnement mensuel

## 🔗 Relations
Users
- hasMany Subscriptions (user_uuid)
- hasMany Attendances (student_uuid)

Teachers
- hasMany Sessions
- hasMany Subscriptions
- hasMany Attendances

Chapters
- hasMany Courses

Courses
- belongsTo Chapter

Sessions
- belongsTo Teacher
- hasMany Attendances

Subscriptions
- belongsTo User
- belongsTo Teacher

Attendances
- belongsTo User
- belongsTo Teacher
- belongsTo Session

## 📈 Index Recommandés
Users:
- UNIQUE(phone)
- role, year_of_study

Subscriptions:
- user_uuid, starts_at, ends_at
- teacher_uuid, starts_at

Sessions:
- teacher_id, start_time
- status

Attendances:
- student_uuid, validated_at
- teacher_uuid, validated_at
- session_id

Courses:
- chapter_id

Chapters:
- year_target

## 🧮 Logique Métier Clé
Accès vidéo : subscription active (ou user.free_subscriber = true)
Pass séance : entrée unique (starts_at=ends_at) — ne prolonge pas l'accès hors session.
Mensuel : fenêtre continue d'accès.
Exonéré (free_subscriber) : bypass des contrôles de dates.

## 🛠️ Commandes de Migration
```bash
php artisan migrate            # Appliquer
php artisan migrate:rollback   # Annuler dernier batch
php artisan migrate:fresh      # Reset + recréation
php artisan migrate:fresh --seed
php artisan migrate:status     # Statut
```

## 🌱 Seeders
```bash
php artisan db:seed --class=UserSeeder
php artisan db:seed --class=TeacherSeeder
```

## 🧪 Points de Test Recommandés
1. Création abonnement mensuel → accès persistant
2. Création pass séance → accès limité session
3. free_subscriber = true → accès sans abonnement
4. Attendance (guest vs subscriber) classification correcte
5. Fin d'abonnement (ends_at passé) → accès refusé

---
Documentation à jour (paiements retirés, flags d'accès supprimés, QR = uuid).
- `status`
