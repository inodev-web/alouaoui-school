# 🗃️ Structure de la Base de Données - Alouaoui School

## 📋 Vue d'ensemble des tables

### 👥 **Users** (Utilisateurs/Étudiants)
```sql
id (PK)                 - Identifiant unique
name                    - Nom complet
email                   - Email unique
phone                   - Numéro de téléphone unique
email_verified_at       - Date de vérification email
password               - Mot de passe hashé
role                   - Enum: 'admin', 'student'
year_of_study          - Enum: '1AM','2AM','3AM','4AM','1AS','2AS','3AS'
device_uuid            - UUID de l'appareil (nullable)
qr_token              - Token QR unique pour check-in
remember_token        - Token de session Laravel
timestamps            - created_at, updated_at
```

### 👨‍🏫 **Teachers** (Enseignants)
```sql
id (PK)                 - Identifiant unique
name                    - Nom de l'enseignant
module                  - Matière enseignée
year                    - Enum: '1AM','2AM','3AM','4AM','1AS','2AS','3AS'
is_online_publisher     - Boolean: publie du contenu en ligne
price_subscription      - Prix d'abonnement mensuel (decimal 8,2)
percent_school          - Pourcentage pour l'école (tinyint)
timestamps             - created_at, updated_at
```

### 📚 **Chapters** (Chapitres)
```sql
id (PK)                 - Identifiant unique
title                   - Titre du chapitre
description            - Description (text, nullable)
teacher_id (FK)        - Référence vers teachers
year_target            - Enum: année cible
timestamps             - created_at, updated_at
```

### 🎥 **Courses** (Cours)
```sql
id (PK)                 - Identifiant unique
chapter_id (FK)        - Référence vers chapters
title                   - Titre du cours
video_ref              - Référence vidéo (URL/chemin)
pdf_summary            - Chemin vers PDF résumé
exercises_pdf          - Chemin vers PDF exercices
year_target            - Enum: année cible
timestamps             - created_at, updated_at
```

### 📅 **Sessions** (Sessions de cours)
```sql
id (PK)                 - Identifiant unique
teacher_id (FK)        - Référence vers teachers
title                   - Titre de la session
description            - Description (text, nullable)
type                   - Enum: 'subscription','free','paid'
price                  - Prix (decimal 8,2, nullable)
year_target            - Enum: année cible
start_time             - Date/heure de début
end_time               - Date/heure de fin
status                 - Enum: 'scheduled','live','completed','cancelled'
meeting_link           - Lien de réunion en ligne
max_participants       - Nombre max de participants
timestamps             - created_at, updated_at
```

### 💳 **Subscriptions** (Abonnements)
```sql
id (PK)                 - Identifiant unique
student_id (FK)        - Référence vers users
teacher_id (FK)        - Référence vers teachers
start_date             - Date de début
end_date               - Date de fin
active                 - Boolean: statut actif
timestamps             - created_at, updated_at
```

### 💰 **Payments** (Paiements)
```sql
id (PK)                 - Identifiant unique
student_id (FK)        - Référence vers users
teacher_id (FK)        - Référence vers teachers
amount                 - Montant (decimal 10,2)
method                 - Enum: 'online','cash'
status                 - Enum: 'pending','confirmed','failed'
payment_details        - Détails JSON (nullable)
transaction_id         - ID transaction externe
confirmed_at           - Date de confirmation
timestamps             - created_at, updated_at
```

### 📊 **Attendances** (Présences)
```sql
id (PK)                 - Identifiant unique
student_id (FK)        - Référence vers users
teacher_id (FK)        - Référence vers teachers
session_id (FK)        - Référence vers sessions (nullable)
date                   - Date de la session
status                 - Enum: 'present','absent'
check_in_time          - Heure d'arrivée
notes                  - Notes additionnelles
timestamps             - created_at, updated_at
```

## 🔗 Relations entre les tables

### **Users (Students)**
- `hasMany` Subscriptions
- `hasMany` Payments
- `hasMany` Attendances

### **Teachers**
- `hasMany` Chapters
- `hasMany` Sessions
- `hasMany` Subscriptions
- `hasMany` Payments
- `hasMany` Attendances

### **Chapters**
- `belongsTo` Teacher
- `hasMany` Courses

### **Courses**
- `belongsTo` Chapter

### **Sessions**
- `belongsTo` Teacher
- `hasMany` Attendances

### **Subscriptions**
- `belongsTo` User (Student)
- `belongsTo` Teacher

### **Payments**
- `belongsTo` User (Student)
- `belongsTo` Teacher

### **Attendances**
- `belongsTo` User (Student)
- `belongsTo` Teacher
- `belongsTo` Session

## 📈 Index de performance

### Users
- `role`, `year_of_study`
- `qr_token`

### Teachers
- `module`, `year`
- `is_online_publisher`

### Chapters
- `teacher_id`, `year_target`
- `year_target`

### Courses
- `chapter_id`, `year_target`
- `year_target`

### Sessions
- `teacher_id`, `status`
- `start_time`, `end_time`
- `type`, `year_target`
- `status`

### Subscriptions
- `student_id`, `active`
- `teacher_id`, `active`
- `start_date`, `end_date`

### Payments
- `student_id`, `status`
- `teacher_id`, `status`
- `status`, `created_at`
- `transaction_id`

### Attendances
- `student_id`, `date`
- `teacher_id`, `date`
- `date`, `status`
- `session_id`

## 🚀 Commandes de migration

```bash
# Exécuter toutes les migrations
php artisan migrate

# Rollback de la dernière migration
php artisan migrate:rollback

# Reset complet et re-migration
php artisan migrate:fresh

# Avec seeders
php artisan migrate:fresh --seed

# Vérifier le statut des migrations
php artisan migrate:status
```

## 🌱 Seeders disponibles

```bash
# Exécuter tous les seeders
php artisan db:seed

# Exécuter un seeder spécifique
php artisan db:seed --class=UserSeeder
php artisan db:seed --class=TeacherSeeder
```
