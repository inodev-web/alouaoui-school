# 🏗️ Modèles Eloquent & Relations - Alouaoui School

## 📋 Vue d'ensemble des modèles

### 👤 **User** (Utilisateurs/Étudiants)
```php
// Relations
hasMany(Subscription::class, 'student_id')
hasMany(Payment::class, 'student_id')  
hasMany(Attendance::class, 'student_id')

// Méthodes utiles
isAdmin() : bool
isStudent() : bool
activeSubscriptions() : HasMany
```

### 👨‍🏫 **Teacher** (Enseignants)
```php
// Relations
hasMany(Chapter::class)
hasMany(Subscription::class)
hasMany(Payment::class)
hasMany(Session::class)
hasMany(Attendance::class)

// Méthodes utiles
activeSubscriptions() : HasMany
isAlouaouiTeacher() : bool
isOnlinePublisher() : bool
```

### 📚 **Chapter** (Chapitres)
```php
// Relations
belongsTo(Teacher::class)
hasMany(Course::class)

// Constantes
YEAR_TARGETS = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS']
```

### 🎥 **Course** (Cours)
```php
// Relations
belongsTo(Chapter::class)
teacher() // Via chapter relationship

// Constantes
YEAR_TARGETS = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS']
```

### 💳 **Subscription** (Abonnements)
```php
// Relations
belongsTo(User::class, 'student_id')
belongsTo(Teacher::class)

// Méthodes utiles
isActive() : bool
isExpired() : bool
daysRemaining() : int

// Constantes
PAYMENT_TYPES = ['cash_presentiel', 'online', 'cash_direct']
```

### 💰 **Payment** (Paiements)
```php
// Relations
belongsTo(User::class, 'student_id')
belongsTo(Teacher::class)

// Méthodes utiles
isConfirmed() : bool
isPending() : bool
isFailed() : bool
markAsConfirmed() : bool
markAsFailed() : bool

// Constantes
METHODS = ['online', 'cash']
STATUSES = ['pending', 'confirmed', 'failed']
CONTEXTS = ['subscription', 'session', 'school_entry']
```

### 📅 **Session** (Sessions de cours)
```php
// Relations
belongsTo(Teacher::class)
hasMany(Attendance::class)

// Méthodes utiles
isLive() : bool
isScheduled() : bool
isCompleted() : bool
isCancelled() : bool

// Constantes
TYPES = ['subscription', 'free', 'paid']
STATUSES = ['scheduled', 'live', 'completed', 'cancelled']
YEAR_TARGETS = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS']
```

### 📊 **Attendance** (Présences)
```php
// Relations
belongsTo(User::class, 'student_id')
belongsTo(Teacher::class)
belongsTo(Session::class)

// Méthodes utiles
isPresent() : bool
isAbsent() : bool

// Constantes
STATUSES = ['present', 'absent']
```

## 🔗 Schéma des relations

```
User (Student)
├── hasMany → Subscriptions
├── hasMany → Payments
└── hasMany → Attendances

Teacher
├── hasMany → Chapters
├── hasMany → Subscriptions
├── hasMany → Payments
├── hasMany → Sessions
└── hasMany → Attendances

Chapter
├── belongsTo → Teacher
└── hasMany → Courses

Course
└── belongsTo → Chapter

Session
├── belongsTo → Teacher
└── hasMany → Attendances

Subscription
├── belongsTo → User (student)
└── belongsTo → Teacher

Payment
├── belongsTo → User (student)
└── belongsTo → Teacher

Attendance
├── belongsTo → User (student)
├── belongsTo → Teacher
└── belongsTo → Session (optional)
```

## 🎯 Règles métier dans les modèles

### **Contrôle d'accès (Subscription)**
- `videos_access` : Accès aux vidéos en ligne
- `lives_access` : Accès aux sessions live
- `school_entry_access` : Accès à l'école en présentiel
- `payment_type` : Type de paiement (cash_presentiel, online, cash_direct)

### **Enseignants spéciaux (Teacher)**
- `is_alouaoui_teacher` : Enseignant Alouaoui (accès en ligne)
- `is_online_publisher` : Publie du contenu en ligne
- `allows_online_payment` : Accepte les paiements en ligne

### **Paiements contextuels (Payment)**
- `payment_context` : Contexte du paiement (subscription, session, school_entry)
- `grants_school_entry` : Donne accès à l'école
- `processor_reference` : Référence du processeur de paiement

## 🔧 Utilisation des modèles

### **Vérifier l'accès d'un étudiant**
```php
$student = User::find(1);
$teacher = Teacher::find(1);

// Vérifier l'abonnement actif
$subscription = $student->subscriptions()
    ->where('teacher_uuid', $teacher->uuid)
    ->where('active', true)
    ->where('start_date', '<=', now())
    ->where('end_date', '>=', now())
    ->first();

if ($subscription && $subscription->videos_access) {
    // L'étudiant a accès aux vidéos
}
```

### **Créer un paiement et abonnement**
```php
$payment = Payment::create([
    'student_id' => $student->id,
    'teacher_uuid' => $teacher->uuid,
    'amount' => $teacher->price_subscription,
    'method' => 'online',
    'status' => 'confirmed',
]);

$subscription = Subscription::create([
    'student_id' => $student->id,
    'teacher_uuid' => $teacher->uuid,
    'start_date' => now()->startOfMonth(),
    'end_date' => now()->endOfMonth(),
    'active' => true,
    'videos_access' => true,
    'lives_access' => true,
    'school_entry_access' => $teacher->is_alouaoui_teacher,
]);
```

### **Enregistrer une présence**
```php
$attendance = Attendance::create([
    'student_id' => $student->id,
    'teacher_uuid' => $teacher->uuid,
    'session_id' => $session->id,
    'date' => now()->toDateString(),
    'status' => 'present',
    'check_in_time' => now(),
]);
```

## 🚀 Commandes utiles

### **Créer les modèles avec relations**
```bash
php artisan make:model User
php artisan make:model Teacher  
php artisan make:model Chapter
php artisan make:model Course
php artisan make:model Subscription
php artisan make:model Payment
php artisan make:model Session
php artisan make:model Attendance
```

### **Tinker pour tester les relations**
```bash
php artisan tinker

# Tester les relations
User::with('subscriptions.teacher')->find(1)
Teacher::with('chapters.courses')->find(1)
Subscription::with('student', 'teacher')->where('active', true)->get()
```
