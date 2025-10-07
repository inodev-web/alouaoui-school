# ✅ TODO MISE À JOUR STRUCTURE (A → Z)

Version: Refactor Abonnements / Accès / Présences (sans paiements)
Date: 2025-10-07

---
## 1. OBJECTIF GLOBAL
Unifier et simplifier le modèle métier :
- Suppression du module Paiements.
- Abonnements réduits (mensuel ou pass séance).
- Pas de champs d'accès (videos_access, lives_access...).
- Ajout d'exonération globale (free_subscriber) donnant accès à tout.
- Prévention des abonnements mensuels qui se chevauchent pour un même (user_uuid, teacher_uuid).
- Ajout du prix séance (price_session) côté enseignant.
- Classification automatique des présences : free | subscriber | session_pass.

---
## 2. SYNTHÈSE DES CHANGEMENTS
| Domaine | Avant | Après |
|--------|-------|-------|
| Users | base | + free_subscriber, free_subscriber_reason |
| Teachers | price_subscription | + price_session |
| Subscriptions | amount, flags, status | (user_uuid, teacher_uuid, starts_at, ends_at) |
| Sessions | titre, description, type, meeting_link, max_participants | start_time, end_time, price (optionnel), status limité |
| Payments | Table + contrôleur + tests | Supprimé |
| Chapters | teacher_uuid + is_free | teacher_name seulement |
| Présences | basique | + validated_at + classification dérivée |
| Accès vidéos | flags subscription | date-range + free_subscriber |
| QR | qr_token | uuid user |

---
## 3. ORDRE D'EXÉCUTION (NE PAS CHANGER L'ORDRE)
1. Sauvegarde / branche
2. Nouvelles migrations
3. Adaptation modèles
4. Services (nouveaux + refactor)
5. Contrôleurs
6. Middlewares
7. Routes
8. Tests backend
9. Frontend (services + UI)
10. Documentation finale
11. Nettoyage + commit final

---
## 4. DÉTAILS PAR ÉTAPE
### 4.1 Sauvegarde / Branche
- Créer une branche: `refactor/subscriptions-v2`
- Tag facultatif: `pre-refactor-payments`

### 4.2 Migrations
Créer migrations dans l'ordre :
1. `2025_xx_add_free_subscriber_columns_to_users_table`
   - add: free_subscriber (boolean, default false)
   - add: free_subscriber_reason (text nullable)
2. `2025_xx_add_price_session_to_teachers_table`
   - add: price_session decimal(8,2) nullable après price_subscription
3. `2025_xx_refactor_sessions_table`
   - drop: title, description, type, meeting_link, max_participants
   - normaliser status → enum ou string ('completed','cancelled')
   - conserver price (renommer pas obligatoire)
4. `2025_xx_simplify_subscriptions_table`
   - drop: amount, videos_access, lives_access, school_entry_access, status, rejection_reason
   - ensure: starts_at, ends_at (datetime)
5. `2025_xx_add_validated_at_to_attendances_table`
   - add: validated_at datetime nullable
6. `2025_xx_drop_payments_table`
   - dropIfExists('payments')
7. (Déjà fait) migrations chapters simplifiées (vérifier is_free retiré)
8. Indices (option si non existants):
   - subscriptions: index(user_uuid, teacher_uuid, starts_at, ends_at)
   - attendances: index(student_uuid, validated_at), index(teacher_uuid, validated_at)

### 4.3 Modèles (app/Models)
- User.php
  - Ajouter fillable free_subscriber, free_subscriber_reason
  - Méthode: `isFree()`
- Teacher.php
  - Ajouter fillable price_session
- Subscription.php
  - Retirer champs obsolètes
  - Méthodes: `isActive()`, `isSessionPass()`, `isMonthly()`
  - Scope: `scopeOverlapping($q, $userUuid, $teacherUuid, $starts, $ends)`
- Attendance.php (si absent → créer)
  - cast validated_at → datetime
  - méthode: `classification()` (retourne 'free' | 'session_pass' | 'subscriber' | 'none')
- Session.php
  - Retirer fillable supprimés
  - Ajout helper: `duration()`

### 4.4 Services
Créer `app/Services/SubscriptionService.php` :
- `createMonthly(User $user, Teacher $teacher)`
  - Vérifier overlap → throw exception
  - starts_at = now(), ends_at = now()->addMonthNoOverflow()
- `createSessionPass(User $user, Teacher $teacher, Session $session)`
  - starts_at = ends_at = session.start_time->startOfDay() ou now()->startOfDay()
- `classify(User $user, Carbon $ts, Teacher $teacher)`

Refactor `AccessControlService.php` :
- `hasVideoAccess(User $u, string $teacherUuid)`
  - if free_subscriber => true
  - else subscription active
- `hasSessionAccess(User $u, Session $s)`

### 4.5 Contrôleurs
- Supprimer PaymentController + use statements associés.
- SubscriptionController
  - `store(Request $r)` => mode = 'monthly' | 'session_pass'
  - Empêcher overlap (monthly)
  - Return JSON { subscription, mode }
- CheckinController
  - scanQr:
    1. Trouver user
    2. if user.free_subscriber => créer Attendance uniquement
    3. else selon input (mode=session_pass|monthly)
    4. classification = service.classify(...)
  - Ajouter endpoint stats si besoin futur
- AuthController
  - Inclure free_subscriber & free_subscriber_reason dans login/register/profile réponses

### 4.6 Middlewares
- `ensure.subscription` → simplifier: vérifier hasVideoAccess() + return 403 sinon.

### 4.7 Routes (routes/api.php)
- Retirer bloc /payments
- Adapter /subscriptions:
  - POST /subscriptions (mode param)
  - GET /subscriptions/active?teacher_uuid=...
  - GET /subscriptions/{id}
- Check-in prefix existant (`/admin/checkin/`) reste OK

### 4.8 Tests
Supprimer / adapter :
- `tests/Feature/PaymentTest.php` (remove)
Créer / modifier :
- `SubscriptionTest`:
  - test_cannot_overlap_monthly()
  - test_can_have_monthly_for_different_teachers()
  - test_session_pass_creation()
- `AccessControlTest`:
  - test_free_subscriber_access_everything()
  - test_no_access_without_subscription()
- `CheckinTest`:
  - test_scan_free_user_creates_attendance_only()
  - test_scan_creates_session_pass_and_attendance()
  - test_scan_monthly_no_duplicate_subscription()
- `AttendanceClassificationTest`:
  - test_guest_classification()
  - test_monthly_classification()

### 4.9 Frontend
Auth service:
- Ajouter gestion free_subscriber & free_subscriber_reason.
Check-In UI:
- Après scan: afficher statut + boutons (désactiver si free)
- Bouton créer pass séance / abonnement mensuel
- Dans profil: badge Exonéré si free_subscriber
Video access guard:
- Appeler /subscriptions/active OR profil + liste abonnements en cache

### 4.10 Documentation
Mettre à jour :
- README.md (déjà partiellement fait)
- DATABASE.md (price_session + précisions overlap déjà intégré ? Vérifier)
- PHASE4_IMPLEMENTATION.md → section refactor / appendice
- Ajouter CHANGELOG.md (optionnel) : version refactor v2

### 4.11 Nettoyage
- Supprimer fichiers Payment restants
- Retirer imports inutiles
- Lancer `php artisan optimize:clear`
- Vérifier `composer dump-autoload`

### 4.12 Validation Finale
1. Migrations passent
2. `php artisan test` vert
3. Scan QR free_subscriber → attendance seulement
4. Double création monthly => 422
5. Création monthly prof A + monthly prof B OK
6. Pass séance n'accorde pas accès hors jour
7. Expiration monthly retire accès vidéo

---
## 5. CHECKLIST RÉSUMÉE
[ ] Branche créée
[ ] Migrations écrites
[ ] Modèles mis à jour
[ ] Services créés / refactor
[ ] Contrôleurs adaptés
[ ] Routes nettoyées
[ ] Middlewares simplifiés
[ ] Tests réécrits
[ ] Frontend adapté
[ ] Docs mises à jour
[ ] Nettoyage / optimization
[ ] Validation finale + merge

---
## 6. POINTS D'ATTENTION
- SQLite: si dropColumn impossible → recréer table temporaire.
- Cohérence timezone (utiliser config app timezone dans comparisons).
- addMonthNoOverflow pour éviter glissement 31→30.
- Ne jamais créer de subscription pour free_subscriber.
- Logs éventuels: si besoin d'historique financier futur, prévoir table future separate (non incluse ici).

---
## 7. SCRIPTS UTILES
(Optionnel) Script artisan interne à créer :
- `php artisan subs:fix-overlaps` → détecter & corriger overlaps historiques.

---
## 8. STRATÉGIE DE DEPLOIEMENT
1. Déployer migrations.
2. Appliquer code (zéro downtime si routes /payments déjà peu utilisées).
3. Purger caches.
4. Vérifier endpoints critiques (login, profile, video access, scan QR).
5. Communiquer changement aux équipes (plus de paiements côté backend).

---
Fin du plan. Exécuter à partir de 4.2.
