# Frontend ↔ Backend Mapping Documentation

## 📋 Correspondances Front-End ↔ Back-End

Ce document fait le mapping entre les pages/fonctionnalités du frontend React et les endpoints/contrôleurs du backend Laravel.

---

## ✅ Mappings Frontend → Backend Existant

### 🔐 Authentification

| Page Frontend | Route Frontend | Backend Controller + Endpoint | Rôle | Statut |
|---------------|----------------|-------------------------------|------|--------|
| LoginPage | `/login` | AuthController → `POST /api/auth/login` | Public | ✅ Implémenté |
| RegisterPage | `/register` | AuthController → `POST /api/auth/register` | Public | ✅ Implémenté |
| ForgotPasswordPage | `/forgot-password` | AuthController → (endpoint manquant) | Public | ❌ Backend manquant |

### 👤 Profil Étudiant

| Page Frontend | Route Frontend | Backend Controller + Endpoint | Rôle | Statut |
|---------------|----------------|-------------------------------|------|--------|
| StudentProfilePage | `/student/profile` | AuthController → `GET /api/auth/profile` | Student | ✅ Implémenté |
| StudentProfilePage (update) | `/student/profile` | AuthController → `PUT /api/auth/profile` | Student | ✅ Implémenté |

### 📚 Gestion des Chapitres/Cours

| Page Frontend | Route Frontend | Backend Controller + Endpoint | Rôle | Statut |
|---------------|----------------|-------------------------------|------|--------|
| ChaptersPage (Student) | `/student/chapters` | ChapterController → `GET /api/chapters` | Student | ✅ Implémenté |
| ChaptersPage (détails cours) | `/student/chapters/:id` | ChapterController → `GET /api/chapters/{id}` | Student | ✅ Implémenté |
| ChaptersAdminPage | `/admin/chapters` | ChapterController → `GET /api/chapters` | Admin | ✅ Implémenté |
| ChaptersAdminPage (create) | `/admin/chapters` | ChapterController → `POST /api/chapters` | Admin | ✅ Implémenté |
| ChaptersAdminPage (update) | `/admin/chapters/:id` | ChapterController → `PUT /api/chapters/{id}` | Admin | ✅ Implémenté |

### 🎥 Gestion des Vidéos/Cours

| Page Frontend | Route Frontend | Backend Controller + Endpoint | Rôle | Statut |
|---------------|----------------|-------------------------------|------|--------|
| ChaptersPage (vidéos) | `/student/chapters/:id/courses` | CourseController → `GET /api/courses` | Student | ✅ Implémenté |
| Admin Courses Upload | `/admin/chapters/courses` | CourseController → `POST /api/courses` | Admin (Alouaoui) | ✅ Implémenté |
| Admin Courses Update | `/admin/chapters/courses/:id` | CourseController → `PUT /api/courses/{id}` | Admin (Alouaoui) | ✅ Implémenté |
| Admin Courses Delete | `/admin/chapters/courses/:id` | CourseController → `DELETE /api/courses/{id}` | Admin (Alouaoui) | ✅ Implémenté |

### 🏫 Gestion des Enseignants

| Page Frontend | Route Frontend | Backend Controller + Endpoint | Rôle | Statut |
|---------------|----------------|-------------------------------|------|--------|
| TeachersPage | `/admin/teachers` | TeacherController → `GET /api/teachers` | Admin | ✅ Implémenté |
| TeachersPage (create) | `/admin/teachers` | TeacherController → `POST /api/teachers` | Admin | ✅ Implémenté |
| TeachersPage (update) | `/admin/teachers/:id` | TeacherController → `PUT /api/teachers/{id}` | Admin | ✅ Implémenté |
| TeachersPage (delete) | `/admin/teachers/:id` | TeacherController → `DELETE /api/teachers/{id}` | Admin | ✅ Implémenté |

### 💰 Gestion des Paiements

| Page Frontend | Route Frontend | Backend Controller + Endpoint | Rôle | Statut |
|---------------|----------------|-------------------------------|------|--------|
| Student Payment History | `/student/payments` | PaymentController → `GET /api/payments/history` | Student | ✅ Implémenté |
| Admin Payments | `/admin/payments` | PaymentController → `GET /api/payments` | Admin | ✅ Implémenté |
| Admin Payment Approval | `/admin/payments/:id/approve` | PaymentController → `PUT /api/payments/{id}/approve` | Admin | ✅ Implémenté |
| Admin Payment Rejection | `/admin/payments/:id/reject` | PaymentController → `PUT /api/payments/{id}/reject` | Admin | ✅ Implémenté |
| Admin Add Cash Payment | `/admin/payments/cash` | PaymentController → `POST /api/payments/add-cash` | Admin | ✅ Implémenté |

### 📋 Gestion des Abonnements

| Page Frontend | Route Frontend | Backend Controller + Endpoint | Rôle | Statut |
|---------------|----------------|-------------------------------|------|--------|
| Student Subscriptions | `/student/subscriptions` | SubscriptionController → `GET /api/subscriptions/active` | Student | ✅ Implémenté |
| Admin Subscriptions | `/admin/subscriptions` | SubscriptionController → `GET /api/subscriptions` | Admin | ✅ Implémenté |
| Admin Create Subscription | `/admin/subscriptions` | SubscriptionController → `POST /api/subscriptions` | Admin | ✅ Implémenté |
| Admin Extend Subscription | `/admin/subscriptions/:id/extend` | SubscriptionController → `PUT /api/subscriptions/{id}/extend` | Admin | ✅ Implémenté |

### 📊 Statistiques/Dashboard

| Page Frontend | Route Frontend | Backend Controller + Endpoint | Rôle | Statut |
|---------------|----------------|-------------------------------|------|--------|
| Student Dashboard | `/student/dashboard` | Multiple endpoints (profil + stats) | Student | ⚠️ Partiellement disponible |
| Admin Dashboard | `/admin/dashboard` | PaymentController → `GET /api/payments/statistics` | Admin | ⚠️ Partiellement disponible |
| Admin Dashboard | `/admin/dashboard` | SubscriptionController → `GET /api/subscriptions/statistics` | Admin | ⚠️ Partiellement disponible |
| Admin Dashboard | `/admin/dashboard` | TeacherController → `GET /api/teachers/statistics` | Admin | ⚠️ Partiellement disponible |

---

## ❌ Pages Frontend SANS Backend Correspondant

Ces pages/fonctionnalités frontend n'ont pas d'équivalent dans le backend et doivent être **supprimées du frontend** ou le backend doit être complété :

### 📄 Pages Statiques
- **AboutPage** (`/about`) → Aucun endpoint nécessaire (page statique)
- **ContactPage** (`/contact`) → Aucun endpoint nécessaire (page statique)
- **HomePage** (`/`) → Aucun endpoint nécessaire (page statique)

### 🎯 Fonctionnalités Frontend sans Backend
- **ForgotPasswordPage** (`/forgot-password`) → Endpoint manquant dans AuthController
- **Student Dashboard stats spécifiques** → Endpoints manquants pour statistiques étudiant
- **Admin Events management** (`/admin/events`) → EventController n'existe pas
- **Admin Check-in QR code** (`/admin/checkin`) → CheckinController existe mais mapping incomplet

---

## 🚫 Fonctionnalités Backend Manquantes côté Frontend

Ces fonctionnalités existent dans le backend mais n'ont **pas d'interface frontend** correspondante :

### 1. **Système de Pointage QR Complet**
- **Backend disponible** : `CheckinController` avec scan QR, présences, statistiques
- **Frontend manquant** : Interface complète pour le système de pointage
- **Endpoints disponibles** :
  - `POST /api/admin/checkin/scan-qr` → Scanner QR
  - `GET /api/admin/checkin/session/{id}/attendance` → Présences par session
  - `GET /api/admin/checkin/stats` → Statistiques de présence
  - `GET /api/admin/checkin/student/{id}/history` → Historique étudiant
  - `POST /api/admin/checkin/manual` → Pointage manuel

### 2. **Gestion Complète des Sessions**
- **Backend disponible** : Logique dans `CheckinController` et modèle `Session`
- **Frontend manquant** : Gestion complète des sessions de cours
- **Fonctionnalités disponibles** :
  - Création de sessions programmées
  - Attribution d'enseignants aux sessions
  - Gestion des créneaux horaires
  - Suivi des présences par session

### 3. **Streaming Vidéo Avancé**
- **Backend disponible** : `StreamController` avec tokens de streaming sécurisés
- **Frontend manquant** : Lecteur vidéo avec contrôle d'accès
- **Endpoints disponibles** :
  - `GET /api/courses/{id}/stream-token` → Token de streaming
  - `GET /api/stream/video/{token}` → Stream sécurisé
  - `GET /api/stream/hls/{token}/playlist.m3u8` → Playlist HLS
  - `POST /api/courses/{id}/report-issue` → Signalement problèmes

### 4. **Jobs de Traitement Vidéo**
- **Backend disponible** : `TranscodeVideoJob` pour transcodage automatique
- **Frontend manquant** : Interface pour suivre le statut des uploads
- **Fonctionnalités disponibles** :
  - Transcodage automatique des vidéos
  - Génération de miniatures
  - Statuts de traitement (draft, processing, published)

### 5. **Webhooks de Paiement**
- **Backend disponible** : `WebhookPaymentJob` avec intégration PSP
- **Frontend manquant** : Interface de configuration des PSP
- **Fonctionnalités disponibles** :
  - Intégration CIB, Satim, Chargily
  - Traitement automatique des paiements
  - Activation automatique des abonnements

### 6. **Gestion Multi-Appareils**
- **Backend disponible** : Système complet de contrôle mono-appareil
- **Frontend manquant** : Interface de gestion des appareils
- **Fonctionnalités disponibles** :
  - UUID d'appareils uniques
  - Déconnexion forcée des autres appareils
  - Historique des connexions par appareil

### 7. **Système de Recherche Avancée**
- **Backend disponible** : `CourseController::search()` avec filtres
- **Frontend manquant** : Interface de recherche avancée
- **Fonctionnalités disponibles** :
  - Recherche par titre, description, enseignant
  - Filtres par année, chapitre, statut
  - Pagination des résultats

### 8. **Notifications et Reporting**
- **Backend disponible** : Logique de notifications dans les jobs
- **Frontend manquant** : Centre de notifications
- **Fonctionnalités disponibles** :
  - Notifications de paiement
  - Alertes d'expiration d'abonnement
  - Rapports de problèmes vidéo

### 9. **Statistiques Avancées**
- **Backend disponible** : Méthodes de statistiques dans tous les contrôleurs
- **Frontend manquant** : Dashboards détaillés avec graphiques
- **Endpoints disponibles** :
  - Statistiques de paiements par période
  - Métriques d'abonnements et rétention
  - Analytics de visionnage vidéo
  - Statistiques de présence par enseignant

### 10. **Gestion des Tokens QR**
- **Backend disponible** : Génération et gestion des tokens QR
- **Frontend manquant** : Interface d'affichage des QR codes
- **Fonctionnalités disponibles** :
  - Génération de QR codes uniques par utilisateur
  - Régénération des tokens expirés
  - Validation des QR codes pour présence

---

## 🔄 Actions Recommandées

### Priorité 1 - Corrections Frontend
1. **Supprimer ou adapter** les pages suivantes qui n'ont pas de backend :
   - EventsPage (pas d'EventController)
   - Certaines statistiques du Dashboard (endpoints manquants)

2. **Implémenter** les endpoints manquants dans le backend :
   - Forgot password dans AuthController
   - Endpoints spécifiques pour dashboard étudiant

### Priorité 2 - Développement Frontend Manquant
1. **Système de pointage QR** → Interface complète de scan et gestion
2. **Lecteur vidéo sécurisé** → Avec tokens de streaming
3. **Gestion des appareils** → Interface mono-appareil
4. **Centre de notifications** → Affichage des alertes système
5. **Statistiques avancées** → Graphiques et métriques détaillées

### Priorité 3 - Optimisations
1. **Recherche avancée** → Interface de filtres complexes
2. **Gestion sessions** → Planning et créneaux
3. **Configuration PSP** → Interface admin pour webhooks
4. **Monitoring uploads** → Suivi du transcodage vidéo

---

## 📝 Notes pour l'équipe

### Pour Younes (Frontend) :
- Le backend est très complet avec beaucoup de fonctionnalités avancées non utilisées
- Priorité sur le système de pointage QR et le streaming vidéo sécurisé
- Plusieurs endpoints de statistiques disponibles pour enrichir les dashboards

### Pour l'équipe Backend :
- Quelques endpoints mineurs manquants (forgot password, dashboard spécifique étudiant)
- Le système est globalement très bien conçu et prêt pour production
- Les jobs et webhooks sont implémentés mais sans interface de monitoring

**Dernière mise à jour**: 25 septembre 2025  
**Statut Backend**: ✅ Production Ready (36/36 tests réussis)  
**Statut Frontend**: 🔄 En développement (structure complète, services à connecter)