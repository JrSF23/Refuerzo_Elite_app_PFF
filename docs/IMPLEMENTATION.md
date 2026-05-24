# Journal d'implémentation — Refuerzo Elite V2

## 1. Objectif

Réécriture complète de Refuerzo Elite avec une séparation nette entre frontend et backend, en partant du cahier des charges et du modèle fonctionnel de la version précédente.

## 2. Choix techniques

### Frontend

- React 19 avec Vite : rechargement rapide en développement, build optimisé en production.
- React Router v7 pour la navigation entre login, dashboard et modules.
- Axios pour les appels à l'API REST.

### Backend

- Laravel 12 (PHP 8.2), compatible avec l'environnement cible.
- Sanctum pour l'authentification par token Bearer.
- Spatie Permission pour les rôles et permissions.

### Persistance

- MySQL 8.0 comme base transactionnelle principale.
- MongoDB non activé : en phase initiale, ni le serveur ni l'extension `php-mongodb` n'étaient garantis dans l'environnement. La table `audit_events` reste modélisée de façon à pouvoir migrer vers MongoDB plus tard si besoin.

### Conteneurisation

- Docker Compose avec trois services : Nginx, PHP-FPM (Laravel) et MySQL.
- `docker-compose.override.yml` chargé automatiquement en développement : montage du code source en volume, port MySQL exposé.
- Makefile pour les commandes courantes.

## 3. Backend

### Authentification et sécurité

- Login par email ou par username.
- Logout avec invalidation du token courant.
- Endpoint `/api/v1/me`.
- Seeder de rôles : `admin`, `coordinator`, `staff`, `teacher`, `guardian`.
- Utilisateur administrateur initial créé par `AdminSeeder`.
- Rate limit : 10 requêtes/minute sur `/login`, 120/minute sur les routes authentifiées.

### Modèle de données

Tables créées par les migrations :

- `guardians`, `teachers`, `subjects`, `students`
- `class_groups`, `enrollments`, `class_sessions`
- `attendances`, `payments`, `audit_events`
- Tables Laravel standard : utilisateurs, sessions, cache, jobs, Sanctum, Spatie Permission

### API REST

Base : `/api/v1`

| Endpoint | Description |
|---|---|
| `POST /login` | Login par username ou email |
| `GET /me` | Utilisateur connecté |
| `POST /logout` | Invalidation du token |
| `GET /dashboard` | Métriques selon le rôle |
| CRUD `/students` | Gestion des élèves |
| CRUD `/guardians` | Tuteurs légaux |
| CRUD `/teachers` | Professeurs |
| CRUD `/subjects` | Matières |
| CRUD `/class-groups` | Groupes de classe |
| CRUD `/enrollments` | Inscriptions |
| CRUD `/class-sessions` | Séances |
| CRUD `/attendances` | Présences |
| CRUD `/payments` | Paiements |

Tous les endpoints de liste supportent la suppression douce (soft delete).

## 4. Frontend

### Structure

- `AppShell` : barre latérale et topbar. Adapte son branding et ses textes selon que l'utilisateur est admin ou professeur.
- `SessionContext` : gestion du token en `localStorage`, vérification de session au démarrage via `/me`.
- `ModulePage` : composant générique qui génère formulaires et tableaux CRUD à partir d'une définition de module. Un seul composant couvre les neuf modules de l'application.
- `DashboardPage` : affiche la vue admin ou la vue professeur selon `data.role` retourné par l'API.

### Tableau de bord par rôle

Le backend retourne un champ `role` dans la réponse de `/dashboard`. Le frontend s'en sert pour choisir quel composant afficher.

**Vue admin :** métriques globales (élèves actifs, groupes, recettes du mois, prochaines séances), liens vers chaque module.

**Vue professeur :** ses groupes assignés, ses prochaines séances, les présences récentes de ses élèves, statistiques de sa classe. Le profil professeur est relié au compte utilisateur par l'email, sans clé étrangère directe entre les tables `users` et `teachers`.

### Badges de statut

Classes CSS globales pour les statuts dans les tableaux :

| Classe | Usage |
|---|---|
| `.badge-ok` | Actif, présent, payé |
| `.badge-warn` | En attente, en retard |
| `.badge-danger` | Inactif, absent, annulé |
| `.badge-muted` | Valeur vide ou non définie |

## 5. Configuration initiale

### Base de données (développement sans Docker)

```
DB_CONNECTION=mysql
DB_DATABASE=refuerzo_elite_v2
DB_HOST=127.0.0.1
DB_PORT=3306
```

### Variables d'environnement Docker

Copier `.env.docker.example` en `.env.docker`. Ce fichier est dans `.gitignore`.

### Vérifications de build

```bash
php artisan migrate:fresh --seed   # OK
php artisan route:list --path=api  # OK
npm run build                       # OK
```

## 6. Identifiants initiaux

| Utilisateur | Mot de passe | Rôle |
|---|---|---|
| `admin` | `Admin12345!` | Administrateur |
| `mgarcia` | `Teacher12345!` | Professeur (Mathématiques) |
| `cmartinez` | `Teacher12345!` | Professeur (Langue) |

## 7. Initialiser la base de données avec des données de démo

```bash
# Sans Docker
php artisan migrate:fresh --seed

# Avec Docker
make migrate-fresh
make seed
```

Cela exécute `AdminSeeder` + `DemoSeeder` et crée :

- 1 utilisateur admin
- 2 professeurs avec compte d'accès
- 3 matières (Mathématiques, Langue, Anglais)
- 4 groupes de classe
- 5 tuteurs / 8 élèves (7 actifs, 1 inactif)
- 11 inscriptions
- 10 séances de classe (janvier 2026)
- environ 30 enregistrements de présence
- 21 paiements d'octobre 2025 à janvier 2026 (payés, en attente, annulés)

## 8. Tests

```bash
# Sans Docker
cd backend && php artisan test

# Avec Docker
make test
```

34 tests au total, tous avec `RefreshDatabase` :

```
AuthTest (10 tests)
  admin peut se connecter avec son email
  admin peut se connecter avec son username
  teacher peut se connecter
  login échoue avec un mauvais mot de passe
  login échoue pour un utilisateur inactif
  login refusé pour le rôle student
  login exige les champs login et password
  /me retourne l'utilisateur authentifié
  /me exige une authentification
  logout invalide le token

StudentTest (14 tests)
  admin peut lister les élèves
  teacher peut lister les élèves
  non authentifié ne peut pas lister
  la recherche par nom fonctionne
  admin peut créer un élève
  teacher ne peut pas créer un élève
  la création échoue sans les champs requis
  la création refuse un statut invalide
  la création refuse un email dupliqué
  admin peut voir un élève
  show retourne 404 pour un id inexistant
  admin peut mettre à jour un élève
  admin peut supprimer un élève (soft delete)
  teacher ne peut pas supprimer un élève

PaymentTest (10 tests)
  admin peut lister les paiements
  teacher n'a pas accès aux paiements
  non authentifié n'a pas accès
  admin peut créer un paiement
  échoue si l'inscription appartient à un autre élève
  refuse une méthode de paiement invalide
  refuse un statut invalide
  exige les champs obligatoires
  permet un paiement sans inscription
  admin peut supprimer un paiement (soft delete)
```

---

## 9. Audit technique — modifications appliquées (2026-05-21)

### 9.1 Validation des champs enum avec `Rule::in()`

Fichiers modifiés : `StudentController`, `PaymentController`, `EnrollmentController`, `ClassGroupController`, `AttendanceController`.

Les champs de type énuméré acceptaient n'importe quelle chaîne. Il était possible d'enregistrer `status = "whatever"` sans erreur.

On a remplacé les règles `'string', 'max:50'` par `Rule::in([...])` avec les valeurs exactes :

| Champ | Valeurs autorisées |
|---|---|
| `students.status` | `active`, `inactive` |
| `enrollments.status` | `active`, `inactive` |
| `class_groups.status` | `active`, `inactive` |
| `attendances.status` | `present`, `absent`, `late` |
| `payments.payment_method` | `cash`, `card`, `transfer` |
| `payments.status` | `paid`, `pending`, `cancelled` |

### 9.2 Validation croisée inscription-élève dans les paiements

Fichier : `PaymentController`.

En créant un paiement, on pouvait indiquer `student_id = 1` et `enrollment_id = 5` même si cette inscription appartenait à l'élève 3. Le backend l'acceptait sans vérifier.

On a ajouté une closure de validation qui vérifie que l'`enrollment_id`, quand il est fourni, appartient bien au `student_id` de la même requête :

```php
function (string $attribute, mixed $value, Closure $fail): void {
    if ($value === null) return;
    $studentId = request()->integer('student_id');
    if ($studentId && !Enrollment::where('id', $value)
            ->where('student_id', $studentId)->exists()) {
        $fail("L'inscription sélectionnée n'appartient pas à cet élève.");
    }
},
```

### 9.3 AuthController hérite de Controller

Fichier : `AuthController`.

`AuthController` n'étendait pas `App\Http\Controllers\Controller`, ce qui l'excluait de tout middleware ou fonctionnalité ajoutée au contrôleur de base. On a ajouté `extends Controller` et l'import correspondant.

### 9.4 Rate limiting sur les routes authentifiées

Fichier : `routes/api.php`.

Seul `/login` avait un rate limit (10/minute). Le reste de l'API n'était pas limité. On a ajouté `throttle:120,1` au groupe de routes authentifiées.

### 9.5 Index de performance sur la base de données

Fichier créé : `database/migrations/2026_05_21_000001_add_performance_indexes.php`.

Les tables n'avaient pas d'index sur les colonnes utilisées dans les filtres et tris. On a créé une migration qui en ajoute sur :

| Table | Colonnes indexées |
|---|---|
| `students` | `status`, `guardian_id` |
| `enrollments` | `status` |
| `class_groups` | `status`, `academic_year` |
| `class_sessions` | `(class_group_id, session_date)` composé |
| `payments` | `status`, `paid_at` |
| `audit_events` | `(entity_type, entity_id)`, `user_id`, `created_at` |

### 9.6 DemoSeeder avec des données réalistes

Fichiers créés : `DemoSeeder.php`, `StudentFactory.php`.

Il n'existait que `AdminSeeder`. Sans données de démo, impossible de montrer le système en fonctionnement lors de la présentation. `DemoSeeder` crée un jeu de données cohérent (voir section 7). `StudentFactory` est utilisée dans les tests automatisés.

### 9.7 Tests de feature

Fichiers créés : `AuthTest.php` (10 tests), `StudentTest.php` (14 tests), `PaymentTest.php` (10 tests).

Seuls les tests de template Laravel existaient. On a écrit 34 tests d'intégration avec `RefreshDatabase` couvrant les comportements critiques du système.

Deux problèmes rencontrés pendant l'écriture des tests :

**Logout :** le test vérifiait que `/me` retournait 401 après un logout. Sanctum met en cache la validation du token dans le même processus de test, donc la deuxième requête s'authentifiait encore depuis le cache mémoire même après suppression en base. Solution : vérifier directement avec `assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId])` plutôt que de refaire une requête HTTP.

**Enrollment croisé :** le helper `createEnrolledStudent()` appelé deux fois dans le même test tentait d'insérer `code = 'TST'` deux fois dans `subjects`, provoquant une `UniqueConstraintViolationException`. Solution : utiliser `'TST' . uniqid()` pour les codes et les champs uniques dans les helpers de test.

### 9.8 Fix frontend : `isAuthenticated` pendant le boot

Fichier : `SessionContext.jsx`.

`isAuthenticated: Boolean(token)` retournait `true` dès le démarrage même si le token était expiré ou révoqué. `RequireAuth` attendait déjà `isBooting`, mais la prop `isAuthenticated` était accessible comme `true` avant que `/me` ne réponde.

On a changé en `isAuthenticated: Boolean(token) && !isBooting`. La valeur reste `false` tant que l'app vérifie le token, et passe à `true` seulement une fois la session confirmée.

### 9.9 Fix frontend : effacement des champs nullables à l'édition

Fichier : `ModulePage.jsx`.

Le payload filtrait tous les champs vides. En mode édition, vider un champ optionnel (téléphone, adresse) ne l'envoyait pas, donc le backend conservait l'ancienne valeur.

On a séparé les deux cas : à la création, les champs vides ne sont pas envoyés ; à l'édition, les champs optionnels vides sont envoyés comme `null` pour que le backend les efface.

### 9.10 Fix frontend : erreur 403 sur les modules en lecture seule

Fichier : `ModulePage.jsx`.

Pour les modules avec des selects liés (ex. groupes → matières, groupes → professeurs), `ModulePage` chargeait les données auxiliaires même quand l'utilisateur n'avait pas le droit de créer ni de modifier. Un professeur qui consultait la liste des groupes recevait une erreur 403 en arrière-plan.

On a ajouté une condition : les données auxiliaires ne sont chargées que si `canCreate || canEdit`.

### 9.11 Tableau de bord par rôle

Fichiers modifiés : `DashboardController.php`, `DashboardPage.jsx`, `AppShell.jsx`, `index.css`.

Les professeurs voyaient le même tableau de bord que les admins, avec des métriques qui n'avaient pas de sens pour eux (nombre total d'élèves, recettes globales).

`DashboardController` bifurque maintenant selon le rôle : si l'utilisateur a le rôle `teacher`, il appelle `teacherDashboard()` au lieu de `adminDashboard()`. Le profil professeur est retrouvé par correspondance d'email entre `users` et `teachers`, sans FK directe.

`DashboardPage` lit le champ `role` de la réponse et affiche `<AdminDashboard>` ou `<TeacherDashboard>` selon le cas. `AppShell` adapte le branding de la barre latérale ("Espace enseignant" vs "Espace équipe").

### 9.12 Conteneurisation Docker

Fichiers créés : `docker/php/Dockerfile`, `docker/php/entrypoint.sh`, `docker/nginx/default.conf`, `docker-compose.yml`, `docker-compose.override.yml`, `Makefile`, `.env.docker.example`.

Architecture à trois services sur un réseau interne `app` :

- **nginx** sert le build React sur `/` et fait proxy de `/api` vers PHP-FPM sur le port 9000.
- **laravel** est une image PHP 8.2 FPM construite depuis `docker/php/Dockerfile`. L'entrypoint attend que MySQL accepte les connexions avant de lancer `php-fpm`.
- **mysql** utilise l'image officielle MySQL 8.0 avec un healthcheck.

Le Dockerfile copie d'abord `composer.json` et `composer.lock` avant le code source pour que `composer install` soit mis en cache et ne se relance pas à chaque changement de fichier PHP.

En développement, `docker-compose.override.yml` se charge automatiquement. Il monte `./backend` en volume dans le conteneur (modifications PHP visibles sans rebuild) et expose le port 3306 pour les clients de base de données.

---

## 10. État du projet

### Terminé

- Validations enum sur tous les contrôleurs
- Validation croisée inscription-élève dans les paiements
- `AuthController` hérite de `Controller`
- Rate limiting sur les routes authentifiées
- Index de performance en base de données
- Données de démo pour les présentations
- 34 tests automatisés
- Fix `isAuthenticated` pendant le boot
- Fix champs nullables en édition
- Fix 403 sur les modules en lecture seule
- Tableau de bord distinct par rôle (admin / professeur)
- Interface adaptée au rôle dans `AppShell`
- Conteneurisation Docker complète avec Makefile

### Améliorations possibles

- Export CSV / PDF des listes
- Journal d'audit visible dans le frontend
- Page de profil utilisateur
- Filtres avancés dans les listes (par statut, date, groupe)
- Indicateurs d'élèves avec paiements en retard
- Rappels de paiement par email
- Vue pour le tuteur / responsable légal
