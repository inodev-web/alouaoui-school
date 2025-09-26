# Frontend Structure Documentation

## Vue d'ensemble de l'application

### Technologies utilisées
- **React** 19.1.1 - Framework principal
- **Vite** 7.1.6 - Outil de build et serveur de développement
- **React Router DOM** 7.9.1 - Routage côté client
- **Redux Toolkit** 2.9.0 - Gestion d'état
- **TailwindCSS** 3.4.17 - Framework CSS utility-first
- **Radix UI** - Composants UI accessibles
- **Axios** 2.0.3 - Client HTTP pour les appels API
- **Lucide React** - Icônes

## Architecture des dossiers

```
frontend/src/
├── components/          # Composants réutilisables
│   ├── admin/          # Composants spécifiques admin
│   ├── auth/           # Composants d'authentification
│   ├── student/        # Composants spécifiques étudiants
│   └── ui/             # Composants UI de base
├── hooks/              # Hooks React personnalisés
├── layouts/            # Layouts d'application
├── lib/                # Utilitaires et configuration
├── pages/              # Pages de l'application
│   ├── admin/          # Pages administrateur
│   ├── auth/           # Pages d'authentification
│   └── student/        # Pages étudiants
├── services/           # Services API
│   └── api/            # Services d'API spécifiques
├── store/              # Configuration Redux
└── router.jsx          # Configuration des routes
```

## Configuration du routage (router.jsx)

### Structure des routes
- **Routes publiques** : Accueil, À propos, Contact
- **Routes d'authentification** : Connexion, Inscription, Mot de passe oublié
- **Routes protégées étudiants** : `/student/*` avec `PrivateRoute`
- **Routes administrateur** : `/admin/*` avec `AdminRoute`

### Routes principales

| Route | Composant | Protection | Description |
|-------|-----------|------------|-------------|
| `/` | `HomePage` | Public | Page d'accueil |
| `/about` | `AboutPage` | Public | À propos |
| `/contact` | `ContactPage` | Public | Contact |
| `/login` | `LoginPage` | Auth | Connexion |
| `/register` | `RegisterPage` | Auth | Inscription |
| `/forgot-password` | `ForgotPasswordPage` | Auth | Mot de passe oublié |
| `/student/*` | Routes étudiants | Privé | Espace étudiant |
| `/admin/*` | Routes admin | Admin | Espace administrateur |

## Pages détaillées

### 1. HomePage (`/`)
- **Composant** : `src/pages/HomePage.jsx`
- **Layout** : Sans layout spécifique
- **Description** : Page d'accueil avec hero section, présentation de l'école
- **Fonctionnalités** :
  - Hero section avec titre et description
  - Sections de présentation des cours
  - Appel à l'action pour inscription
- **APIs utilisées** : Aucune (contenu statique)
- **Composants liés** : Composants UI de base

### 2. LoginPage (`/login`)
- **Composant** : `src/pages/auth/LoginPage.jsx`
- **Layout** : Sans layout spécifique
- **Description** : Formulaire de connexion avec validation
- **Fonctionnalités** :
  - Formulaire email/mot de passe
  - Validation des champs
  - Gestion des erreurs
  - Lien vers inscription et récupération mot de passe
- **APIs utilisées** : 
  - `POST /auth/login` (à implémenter dans `auth.service.js`)
- **Composants liés** : Composants de formulaire UI

### 3. RegisterPage (`/register`)
- **Composant** : `src/pages/auth/RegisterPage.jsx`
- **Layout** : Sans layout spécifique
- **Description** : Formulaire d'inscription étudiant
- **Fonctionnalités** :
  - Formulaire complet (nom, prénom, email, mot de passe, téléphone)
  - Validation en temps réel
  - Confirmation mot de passe
- **APIs utilisées** :
  - `POST /auth/register` (à implémenter dans `auth.service.js`)
- **Composants liés** : Composants de formulaire UI

### 4. Student Dashboard (`/student/dashboard`)
- **Composant** : `src/pages/student/DashboardPage.jsx`
- **Layout** : `StudentLayout`
- **Description** : Tableau de bord étudiant avec statistiques
- **Fonctionnalités** :
  - Cartes de statistiques (cours complétés, temps d'étude, etc.)
  - Progression des cours
  - Prochaines sessions
  - Activités récentes
- **APIs utilisées** :
  - `GET /student/dashboard` (à implémenter dans `student.service.js`)
  - `GET /student/progress` (à implémenter)
- **Composants liés** : Composants de statistiques, cartes UI

### 5. Student Profile (`/student/profile`)
- **Composant** : `src/pages/student/StudentProfilePage.jsx`
- **Layout** : `StudentLayout`
- **Description** : Profil étudiant avec informations personnelles
- **Fonctionnalités** :
  - Affichage des informations personnelles
  - Modification du profil
  - Gestion de l'avatar
  - Historique des sessions
- **APIs utilisées** :
  - `GET /student/profile` (à implémenter dans `student.service.js`)
  - `PUT /student/profile` (à implémenter)
- **Composants liés** : Formulaires, upload d'image

### 6. Student Chapters (`/student/chapters`)
- **Composant** : `src/pages/student/ChaptersPage.jsx`
- **Layout** : `StudentLayout`
- **Description** : Liste des chapitres de physique avec contenu détaillé
- **Fonctionnalités** :
  - Affichage des chapitres par catégorie
  - Recherche et filtrage
  - Détails des cours dans chaque chapitre
  - Modal avec liste des leçons
- **APIs utilisées** :
  - `GET /chapters` (à implémenter dans `course.service.js`)
  - `GET /chapters/:id/courses` (à implémenter)
- **Composants liés** : Cartes de chapitres, modals, composants de recherche

### 7. Admin Dashboard (`/admin/dashboard`)
- **Composant** : `src/pages/admin/DashboardPage.jsx`
- **Layout** : `AdminLayout`
- **Description** : Tableau de bord administrateur avec KPIs
- **Fonctionnalités** :
  - Vue d'ensemble des statistiques
  - Graphiques de performance
  - Indicateurs clés (étudiants, revenus, sessions)
  - Alertes et notifications
- **APIs utilisées** :
  - `GET /admin/dashboard` (à implémenter dans `admin.service.js`)
  - `GET /admin/stats` (à implémenter)
- **Composants liés** : Graphiques, cartes de statistiques

### 8. Admin Students (`/admin/students`)
- **Composant** : `src/pages/admin/StudentsPage.jsx`
- **Layout** : `AdminLayout`
- **Description** : Gestion des étudiants
- **Fonctionnalités** :
  - Statistiques des étudiants
  - Table filtrable des étudiants
  - Ajout/modification/suppression d'étudiants
  - Filtres avancés
- **APIs utilisées** :
  - `GET /admin/students` (à implémenter dans `admin.service.js`)
  - `POST /admin/students` (à implémenter)
  - `PUT /admin/students/:id` (à implémenter)
  - `DELETE /admin/students/:id` (à implémenter)
- **Composants liés** : `StudentsTable`, `AddStudentModal`, `StudentsFilters`

### 9. Admin Teachers (`/admin/teachers`)
- **Composant** : `src/pages/admin/TeachersPage.jsx`
- **Layout** : `AdminLayout`
- **Description** : Gestion des enseignants
- **Fonctionnalités** :
  - Liste des enseignants
  - Gestion des profils enseignants
  - Attribution des cours
- **APIs utilisées** :
  - `GET /admin/teachers` (à implémenter dans `teacher.service.js`)
  - `POST /admin/teachers` (à implémenter)
- **Composants liés** : Composants de gestion des enseignants

### 10. Admin Sessions (`/admin/sessions`)
- **Composant** : `src/pages/admin/SessionsPage.jsx`
- **Layout** : `AdminLayout`
- **Description** : Gestion des sessions de cours
- **Fonctionnalités** :
  - Planning des sessions
  - Gestion des créneaux
  - Attribution enseignant/étudiant
- **APIs utilisées** :
  - `GET /admin/sessions` (à implémenter dans `session.service.js`)
  - `POST /admin/sessions` (à implémenter)
- **Composants liés** : Calendrier, formulaires de session

### 11. Admin Events (`/admin/events`)
- **Composant** : `src/pages/admin/EventsPage.jsx`
- **Layout** : `AdminLayout`
- **Description** : Gestion des événements
- **Fonctionnalités** :
  - Création d'événements
  - Gestion du calendrier
  - Notifications aux étudiants
- **APIs utilisées** :
  - `GET /admin/events` (à implémenter dans `admin.service.js`)
  - `POST /admin/events` (à implémenter)
- **Composants liés** : Formulaires d'événement, calendrier

### 12. Admin Check-in (`/admin/checkin`)
- **Composant** : `src/pages/admin/CheckInPage.jsx`
- **Layout** : `AdminLayout`
- **Description** : Système de pointage/présence
- **Fonctionnalités** :
  - Enregistrement des présences
  - Scan QR code
  - Suivi temps réel
- **APIs utilisées** :
  - `POST /admin/checkin` (à implémenter)
  - `GET /admin/attendance` (à implémenter)
- **Composants liés** : Scanner QR, listes de présence

### 13. Admin Chapters (`/admin/chapters`)
- **Composant** : `src/pages/admin/ChaptersAdminPage.jsx`
- **Layout** : `AdminLayout`
- **Description** : Gestion du contenu pédagogique
- **Fonctionnalités** :
  - Création/modification des chapitres
  - Gestion des cours et leçons
  - Upload de contenu multimédia
- **APIs utilisées** :
  - `GET /admin/chapters` (à implémenter dans `course.service.js`)
  - `POST /admin/chapters` (à implémenter)
  - `PUT /admin/chapters/:id` (à implémenter)
- **Composants liés** : Éditeurs de contenu, upload multimédia

## Layouts

### StudentLayout
- **Fichier** : `src/layouts/StudentLayout.jsx`
- **Description** : Layout pour l'espace étudiant
- **Composants inclus** :
  - Header avec navigation étudiant
  - Sidebar avec menu étudiant
  - Footer
  - Zone de contenu avec `<Outlet />`
- **Navigation** : Dashboard, Profil, Chapitres, Sessions, etc.

### AdminLayout
- **Fichier** : `src/layouts/AdminLayout.jsx`
- **Description** : Layout pour l'espace administrateur
- **Composants inclus** :
  - AdminHeader avec navigation admin
  - AdminSidebar avec menu administrateur
  - Zone de contenu avec `<Outlet />`
- **Navigation** : Dashboard, Étudiants, Enseignants, Sessions, Événements, etc.

## Composants principaux

### Composants d'authentification (components/auth/)
- **AuthGuard** : Protection des routes
- **LoginForm** : Formulaire de connexion
- **RegisterForm** : Formulaire d'inscription
- **PasswordReset** : Réinitialisation mot de passe

### Composants administrateur (components/admin/)
- **StudentsTable** : Table des étudiants avec tri/filtre
- **AddStudentModal** : Modal d'ajout d'étudiant
- **StudentsFilters** : Filtres pour la liste des étudiants
- **DashboardStats** : Cartes de statistiques
- **AdminSidebar** : Menu latéral administrateur
- **AdminHeader** : En-tête administrateur

### Composants étudiant (components/student/)
- **StudentDashboard** : Composants du tableau de bord
- **ProfileCard** : Carte de profil étudiant
- **ProgressChart** : Graphiques de progression
- **ChapterCard** : Cartes de chapitre
- **SessionCard** : Cartes de session

### Composants UI (components/ui/)
Basés sur Radix UI et TailwindCSS :
- **Button** : Boutons avec variants
- **Card** : Cartes avec header/content
- **Input** : Champs de saisie
- **Modal/Dialog** : Fenêtres modales
- **Table** : Tables avec tri et pagination
- **Form** : Composants de formulaire
- **Badge** : Badges et labels
- **Avatar** : Avatars utilisateur

## Services API

### Structure des services (services/api/)

#### auth.service.js
```javascript
// À implémenter
- login(credentials)
- register(userData)
- logout()
- forgotPassword(email)
- resetPassword(token, newPassword)
- refreshToken()
```

#### student.service.js
```javascript
// À implémenter
- getProfile()
- updateProfile(data)
- getDashboard()
- getProgress()
- getSessions()
- getChapters()
```

#### admin.service.js
```javascript
// À implémenter
- getDashboard()
- getStats()
- getStudents()
- createStudent(data)
- updateStudent(id, data)
- deleteStudent(id)
- getEvents()
- createEvent(data)
```

#### teacher.service.js
```javascript
// À implémenter
- getTeachers()
- createTeacher(data)
- updateTeacher(id, data)
- deleteTeacher(id)
- getTeacherSessions(id)
```

#### course.service.js
```javascript
// À implémenter
- getChapters()
- getChapter(id)
- createChapter(data)
- updateChapter(id, data)
- getCourses(chapterId)
- createCourse(data)
```

#### session.service.js
```javascript
// À implémenter
- getSessions()
- createSession(data)
- updateSession(id, data)
- deleteSession(id)
- getSessionAttendance(id)
```

### Configuration Axios
- **Fichier** : `services/axios.config.js` (actuellement vide)
- **À configurer** :
  - Base URL de l'API Laravel
  - Intercepteurs pour l'authentification
  - Gestion des erreurs globales
  - Headers par défaut

## État de l'application (Redux)

### Store (store/)
- Configuration Redux Toolkit
- Slices pour chaque domaine :
  - `authSlice` : Authentification utilisateur
  - `studentSlice` : Données étudiant
  - `adminSlice` : Données administrateur
  - `courseSlice` : Contenu pédagogique
  - `uiSlice` : État de l'interface

## Hooks personnalisés (hooks/)

### Hooks d'authentification
- `useAuth()` : Gestion de l'état d'authentification
- `useRole()` : Vérification des rôles utilisateur

### Hooks de données
- `useStudents()` : Gestion des données étudiants
- `useCourses()` : Gestion du contenu pédagogique
- `useSessions()` : Gestion des sessions

### Hooks UI
- `useModal()` : Gestion des modals
- `useToast()` : Notifications toast
- `useForm()` : Gestion des formulaires

## Sécurité et protection des routes

### PrivateRoute
- Vérification de l'authentification
- Redirection vers login si non authentifié
- Protection de l'espace étudiant

### AdminRoute
- Vérification du rôle administrateur
- Protection de l'espace admin
- Gestion des permissions

### Gestion des tokens
- Stockage sécurisé des tokens JWT
- Rafraîchissement automatique
- Déconnexion automatique si token expiré

## Intégration backend requise

### APIs à implémenter côté Laravel
1. **Authentification** : `/api/auth/*`
2. **Étudiants** : `/api/students/*`
3. **Administrateur** : `/api/admin/*`
4. **Enseignants** : `/api/teachers/*`
5. **Cours/Chapitres** : `/api/courses/*`, `/api/chapters/*`
6. **Sessions** : `/api/sessions/*`
7. **Événements** : `/api/events/*`

### WebSocket (websocket.service.js)
- Service pour les notifications en temps réel
- Mise à jour des données en direct
- Chat et messagerie instantanée

## Prochaines étapes

### Priorité 1 : Connexion backend
1. Configurer axios avec l'URL de l'API Laravel
2. Implémenter les services API manquants
3. Connecter l'authentification avec le backend
4. Tester les flux d'authentification

### Priorité 2 : Fonctionnalités métier
1. Implémenter la gestion complète des étudiants
2. Développer le système de sessions/cours
3. Intégrer le contenu pédagogique
4. Système de notifications

### Priorité 3 : Optimisations
1. Lazy loading des composants
2. Cache des données API
3. Optimisation des performances
4. Tests unitaires et d'intégration

## Notes techniques

### Performance
- Lazy loading implémenté pour les pages
- Composants optimisés avec React.memo si nécessaire
- Gestion efficace de l'état Redux

### Accessibilité
- Utilisation de Radix UI pour l'accessibilité
- Support des lecteurs d'écran
- Navigation au clavier

### Responsive Design
- TailwindCSS pour le responsive
- Design mobile-first
- Breakpoints configurés

### Internationalisation
- Support pour l'arabe (dir="rtl")
- Interface bilingue français/arabe
- Gestion des textes RTL