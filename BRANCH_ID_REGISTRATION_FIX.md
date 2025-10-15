# Fix: Branch ID Not Stored During Registration

## Problème
Le `branch_id` n'était pas stocké dans la table `users` lors de l'inscription d'un nouvel étudiant, même si l'utilisateur sélectionnait un fret dans le formulaire d'inscription.

## Cause Racine
Deux problèmes identifiés :

### 1. Backend - AuthController
Le endpoint de registration ne validait pas et ne stockait pas le champ `branch_id`.

**Fichier**: `backend/app/Http/Controllers/Api/AuthController.php`

**Problème**:
- Le champ `branch_id` n'était pas dans les règles de validation
- Le champ `branch_id` n'était pas passé à `User::create()`

### 2. Frontend - RegisterPage
Le formulaire d'inscription collectait le `branch_id` mais ne l'envoyait pas au backend.

**Fichier**: `frontend/src/pages/auth/RegisterPage.jsx`

**Problème**:
- Le `branch_id` était dans le state mais pas inclus dans l'objet `userData` envoyé au backend

## Solution

### 1. Backend - AuthController

**Ajouté dans les règles de validation**:
```php
'branch_id' => 'sometimes|nullable|exists:branches,id',
```

**Ajouté dans User::create()**:
```php
$user = User::create([
    'firstname' => $request->firstname,
    'lastname' => $request->lastname,
    'birth_date' => $request->birth_date,
    'address' => $request->address,
    'school_name' => $request->school_name,
    'phone' => $request->phone,
    'password' => Hash::make($request->password),
    'role' => 'student',
    'year_of_study' => $request->year_of_study,
    'branch_id' => $request->branch_id,  // ✅ Ajouté
    'device_uuid' => $deviceUuid,
]);
```

### 2. Frontend - RegisterPage

**Ajouté l'envoi du branch_id**:
```javascript
const userData = {
    firstname: formData.firstname.trim(),
    lastname: formData.lastname.trim(),
    birth_date: formData.birth_date,
    address: formData.address.trim(),
    school_name: formData.school_name.trim(),
    year_of_study: formData.year_of_study,
    phone: formData.phone,
    password: formData.password,
    password_confirmation: formData.password_confirmation,
}

// Add branch_id only for high school students
if (['1AS', '2AS', '3AS'].includes(formData.year_of_study) && formData.branch_id) {
    userData.branch_id = formData.branch_id  // ✅ Ajouté
}
```

## Logique de Validation

### Backend
- Le champ `branch_id` est **optionnel** (`sometimes|nullable`)
- Si fourni, il doit exister dans la table `branches`
- Pas de validation automatique pour vérifier la correspondance avec `year_of_study` (à ajouter si nécessaire)

### Frontend
- Le champ `branch_id` est **requis** uniquement pour les étudiants du lycée (1AS, 2AS, 3AS)
- Le champ est affiché et validé seulement si `year_of_study` est `1AS`, `2AS`, ou `3AS`
- Pour les étudiants du collège (1AM-4AM), le champ `branch_id` n'est pas envoyé

## Workflow Complet

### Pour un étudiant de lycée (1AS/2AS/3AS)
1. L'utilisateur sélectionne son année d'étude (ex: `1AS`)
2. Le frontend charge automatiquement les branches disponibles pour cette année
3. L'utilisateur sélectionne une branche (ex: Sciences Expérimentales)
4. Le frontend valide que `branch_id` est sélectionné
5. Le frontend envoie `branch_id` avec les autres données d'inscription
6. Le backend valide que `branch_id` existe dans la table `branches`
7. Le backend crée l'utilisateur avec `branch_id` stocké

### Pour un étudiant de collège (1AM-4AM)
1. L'utilisateur sélectionne son année d'étude (ex: `4AM`)
2. Le champ de sélection de branche n'est **pas affiché**
3. Le frontend ne valide pas `branch_id`
4. Le frontend n'envoie **pas** `branch_id` au backend
5. Le backend crée l'utilisateur avec `branch_id` = `null`

## Fichiers Modifiés

### Backend
- `backend/app/Http/Controllers/Api/AuthController.php`
  - Ajout de la validation pour `branch_id`
  - Ajout de `branch_id` dans `User::create()`

### Frontend
- `frontend/src/pages/auth/RegisterPage.jsx`
  - Ajout de `branch_id` dans l'objet `userData` envoyé au backend
  - Logique conditionnelle pour n'envoyer que pour les lycéens

## Tests à Effectuer

### ✅ Inscription Lycée avec Branche
1. S'inscrire avec année = `1AS`, `2AS`, ou `3AS`
2. Sélectionner une branche
3. Vérifier que `branch_id` est bien stocké dans la table `users`
4. Vérifier que la branche s'affiche correctement après login

### ✅ Inscription Lycée sans Branche (Validation)
1. S'inscrire avec année = `1AS`
2. Ne pas sélectionner de branche
3. Vérifier que le frontend affiche une erreur de validation
4. Vérifier que l'inscription est bloquée

### ✅ Inscription Collège sans Branche
1. S'inscrire avec année = `1AM`, `2AM`, `3AM`, ou `4AM`
2. Vérifier que le champ branche n'est pas affiché
3. Vérifier que `branch_id` = `null` dans la table `users`
4. Vérifier que l'inscription réussit sans erreur

## Impact

### Avant la correction
- ❌ Les étudiants de lycée s'inscrivaient sans `branch_id` stocké
- ❌ Les sessions filtrées par branche ne s'affichaient pas correctement
- ❌ Les statistiques par branche étaient incorrectes

### Après la correction
- ✅ Les étudiants de lycée ont leur `branch_id` correctement stocké
- ✅ Les sessions sont correctement filtrées par branche
- ✅ Les statistiques et rapports sont précis
- ✅ L'expérience utilisateur est cohérente

## Notes Importantes

1. **Rétroactivité**: Les comptes créés avant cette correction n'ont pas de `branch_id`. Il faudra peut-être:
   - Permettre aux étudiants de mettre à jour leur branche dans leur profil
   - Ou créer une migration/script pour assigner les branches manquantes

2. **Validation supplémentaire possible**: On pourrait ajouter une validation backend pour vérifier que le `branch_id` correspond bien au `year_level` de la branche:
   ```php
   if ($request->branch_id && $request->year_of_study) {
       $branch = Branch::find($request->branch_id);
       if ($branch && $branch->year_level !== $request->year_of_study) {
           return response()->json([
               'message' => 'الفرع المحدد لا يتطابق مع السنة الدراسية',
               'errors' => ['branch_id' => ['الفرع غير متوافق مع السنة الدراسية']]
           ], 422);
       }
   }
   ```

3. **Cohérence avec UserController**: Le `UserController@store` a déjà cette validation et logique, il serait bon d'harmoniser les deux endpoints.

## Recommandations Futures

1. **Permettre la mise à jour de la branche**: Ajouter un endpoint ou une option dans le profil pour que les étudiants puissent changer leur branche si nécessaire

2. **Script de migration**: Créer un script pour assigner automatiquement les branches aux comptes existants basé sur leur `year_of_study`

3. **Validation cohérente**: Créer une fonction de validation réutilisable pour le `branch_id` utilisée par `register`, `update`, etc.
