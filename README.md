# Refuerzo Elite V2

Système de gestion **multi-organisation** pour centres de soutien scolaire. Plusieurs centres cohabitent sur une même installation avec des données **totalement isolées** : chacun perçoit le système comme s'il lui appartenait en propre.

Couvre le cycle complet : élèves, tuteurs, professeurs, groupes, séances, présences et paiements.

## Modèle multi-organisation

L'**organisation** est l'unité d'isolement. Toute entité métier lui appartient via `organization_id`, et l'organisation active se déduit **toujours** de l'utilisateur authentifié — jamais d'un paramètre envoyé par le client.

Le filtrage est appliqué au niveau du modèle par un *global scope*, pas dans les contrôleurs : accéder à une ressource d'un autre centre renvoie **404**, indistinguable d'un identifiant inexistant.

Une organisation peut être **suspendue** ou **supprimée** (suppression logique). Ce sont deux conditions **indépendantes** : l'accès n'est accordé que si l'organisation existe, n'est pas supprimée *et* est active. Dans les deux cas les données restent intactes et récupérables, et l'accès est coupé à la requête suivante sans révoquer aucun jeton.

### Rôles

| Rôle | Organisation | Périmètre |
|---|---|---|
| `super_admin` | aucune | Organisations et comptes. **Aucun accès aux données métier**, quelle que soit l'organisation |
| `org_admin` | obligatoire | Tout le domaine de son centre, y compris ses comptes et les paiements |
| `teacher` | obligatoire | Uniquement les groupes qu'il enseigne, les élèves qui y sont inscrits et les présences de ses séances. **Aucun accès aux paiements** |

Un compte appartient à **une seule** organisation. Une personne travaillant dans deux centres a besoin de deux comptes avec des emails distincts : l'email d'un compte est unique sur toute la plateforme, tandis que les emails d'élèves, professeurs et tuteurs, ainsi que les codes de matière et de groupe, sont uniques **par organisation** — deux centres peuvent donc utiliser « MAT-1 » simultanément.

Les groupes qu'un enseignant « enseigne » sont ceux de la fiche professeur liée à son compte (`teachers.user_id`). Un compte enseignant **sans fiche liée ne voit aucun groupe ni aucun élève** : en cas de doute, l'accès se ferme, il ne s'ouvre pas.

## Stack

| Couche | Technologie |
|---|---|
| Backend | Laravel 12 (PHP 8.2), Sanctum, Spatie Permission |
| Frontend | React 19, Vite, React Router v7, Axios |
| Base de données | MySQL 8.0 |
| Serveur web | Nginx 1.27 (production) |
| Conteneurs | Docker + Docker Compose |

## Démarrage avec Docker (recommandé)

Le projet est prêt à tourner en une seule commande. Pas besoin d'avoir PHP, Node ni MySQL installés localement.

**Prérequis :** Docker Desktop et Make.

```bash
# 1. Copier et remplir les identifiants
cp .env.docker.example .env.docker

# 2. Build + migrations + seed en une étape
make setup
```

L'application est disponible sur `http://localhost`. Le frontend (React compilé) et l'API (`/api/v1`) sont servis par le même Nginx.

### Commandes utiles

```bash
make up            # démarrer les conteneurs
make down          # arrêter
make logs          # voir les logs en direct
make shell         # bash dans le conteneur Laravel
make migrate       # lancer les migrations
make seed          # peupler la base de données
make test          # lancer la suite de tests
make build         # reconstruire les images depuis zéro
```

## Architecture Docker

Trois services sur un réseau interne `app` :

- **nginx** — sert le build React sur `/` et fait proxy de `/api` vers PHP-FPM
- **laravel** — PHP 8.2 FPM avec le backend Laravel
- **mysql** — MySQL 8.0 avec volume persistant

En développement, `docker-compose.override.yml` se charge automatiquement : monte le code source en volume (modifications PHP sans rebuild) et expose le port 3306 pour se connecter avec un client de base de données.

## Identifiants initiaux

Créés par le seeder. **À changer avant de déployer en production.**

| Utilisateur | Mot de passe | Rôle | Organisation |
|---|---|---|---|
| `superadmin` | `SUPER_ADMIN_PASSWORD` | `super_admin` | aucune |
| `admin` | `ADMIN_PASSWORD` | `org_admin` | Refuerzo Elite |

Le seeder de démonstration (`DemoSeeder`) peuple en plus **deux** organisations complètes, ce qui rend l'isolement vérifiable à la main depuis l'interface :

| Utilisateur | Mot de passe | Rôle | Organisation |
|---|---|---|---|
| `admin.a` | `Admin12345!` | `org_admin` | Refuerzo Elite |
| `mgarcia.a` / `cmartinez.a` | `Teacher12345!` | `teacher` | Refuerzo Elite |
| `admin.b` | `Admin12345!` | `org_admin` | Centro Piloto Malabo |
| `lnvono.b` / `tela.b` | `Teacher12345!` | `teacher` | Centro Piloto Malabo |

Les deux organisations utilisent volontairement les **mêmes** codes de matière et de groupe (`MAT`, `MAT-A`…) : c'est ce que l'unicité par organisation rend possible.

## API

Base : `/api/v1`

Authentification par token Bearer (Sanctum). Tous les endpoints protégés nécessitent `Authorization: Bearer <token>`.

Deux familles de routes :

- **Plateforme** (`/organizations`, `/users`) — réservées au `super_admin` (et au `org_admin` pour ses propres comptes). Elles ne passent pas par le contexte d'organisation, puisque le super administrateur n'en a aucune.
- **Métier** (tout le reste) — protégées par le middleware `tenant` : sans organisation active, on n'y accède pas.

| Module | Endpoint | Notes |
|---|---|---|
| Auth | `POST /login`, `GET /me`, `POST /logout` | Login par username ou email. `/me` porte le bloc `organization` |
| Organisations | `GET/POST /organizations`, `GET/PUT/DELETE /organizations/{id}` | `super_admin` uniquement. Suppression logique, refusée en 409 tant que l'organisation est active et a des comptes actifs |
| Suspension | `POST /organizations/{id}/suspend`, `POST /organizations/{id}/activate` | Idempotents et tracés |
| Comptes | `GET/POST /users`, `GET/PUT/DELETE /users/{id}` | `super_admin` : toute organisation. `org_admin` : uniquement la sienne, et l'`organization_id` envoyé par le client est **ignoré** |
| Tableau de bord | `GET /dashboard` | Réponse différente selon le rôle |
| Élèves | `GET/POST /students`, `GET/PUT/DELETE /students/{id}` | Soft delete |
| Tuteurs | `GET/POST /guardians`, `GET/PUT/DELETE /guardians/{id}` | |
| Professeurs | `GET/POST /teachers`, `GET/PUT/DELETE /teachers/{id}` | |
| Matières | `GET/POST /subjects`, `GET/PUT/DELETE /subjects/{id}` | |
| Groupes | `GET/POST /class-groups`, `GET/PUT/DELETE /class-groups/{id}` | |
| Séances | `GET/POST /class-sessions`, `GET/PUT/DELETE /class-sessions/{id}` | |
| Inscriptions | `GET/POST /enrollments`, `GET/PUT/DELETE /enrollments/{id}` | |
| Présences | `GET/POST /attendances`, `GET/PUT/DELETE /attendances/{id}` | |
| Paiements | `GET/POST /payments`, `GET/PUT/DELETE /payments/{id}` | |

### Validations notables

- Champs énumérés validés avec `Rule::in()` sur tous les contrôleurs (`status`, `payment_method`, `attendance_status`)
- À la création d'un paiement, si `enrollment_id` est fourni, on vérifie que l'inscription appartient au même élève
- Rate limit : 120 requêtes/minute par utilisateur authentifié

## Tableau de bord par rôle

L'endpoint `/api/v1/dashboard` retourne des données différentes selon le rôle de l'utilisateur connecté.

**Administration du centre (`org_admin`) :** métriques de **son** organisation (élèves actifs, groupes, recettes du mois, prochaines séances) et accès à tous les modules du centre.

**Professeur :** ses groupes assignés, ses prochaines séances, les présences récentes de ses élèves et les statistiques de sa classe, sans aucun chiffre financier. Le compte est relié à sa fiche professeur par `teachers.user_id` — plus par email, qui était fragile et n'a jamais été une règle d'accès acceptable.

## Frontend

SPA en React 19. L'authentification utilise `SessionContext` avec les tokens stockés dans `localStorage`. Le routage est géré par React Router v7.

- `DashboardPage` — affiche la vue admin ou la vue professeur selon `data.role`
- `ModulePage` — composant générique qui génère formulaires et tableaux CRUD à partir d'une définition de module
- `AppShell` — barre latérale et topbar qui adapte son texte et son branding selon le rôle
- Badges de statut colorés (ok / warn / danger / muted) dans les tableaux et listes

## Tests

```bash
make test
# ou à l'intérieur du conteneur :
php artisan test
```

**241 tests** (606 assertions). L'isolement entre organisations n'est pas optionnel : la constitution du produit exige qu'aucune fonctionnalité touchant aux données d'une organisation ne soit considérée terminée sans ces tests au vert.

**Isolement (le cœur)**

- `TenantIsolationTest` — la batterie A/B : les 9 entités exposées par l'API × les 4 opérations, plus les événements d'audit vérifiés au niveau du modèle
- `CrossReferenceValidationTest` — inscrire son propre élève dans un groupe d'un autre centre, et cas analogues
- `ClientOrganizationIdIgnoredTest` — l'`organization_id` envoyé par le client n'est jamais utilisé
- `UniquePerOrganizationTest` — mêmes codes et mêmes emails dans deux centres
- `SoftDeleteIsolationTest` — `withTrashed()` ne contourne pas le filtre
- `RouteTenantCoverageTest` — toute route métier porte bien le middleware `tenant`
- `SuperAdminBusinessDataTest` — le super administrateur n'atteint aucune donnée métier

**Migration** — `MigrationBackfillTest`, `LegacyCredentialsTest`

**Rôles** — `OrganizationManagementTest`, `OrganizationSuspensionTest`, `PlatformUserManagementTest`, `OrgAdminScopeTest`, `OrgAdminUserCreationTest`, `TeacherScopeTest`, `TeacherAttendanceScopeTest`, `TeacherPaymentDenialTest`, `TeacherWithoutProfileTest`

**Métier** — `AuthTest`, `StudentTest`, `PaymentTest`

La plupart utilisent `RefreshDatabase`. Les tests de migration utilisent `DatabaseMigrations` : `RefreshDatabase` enveloppe chaque test dans une transaction, et sous SQLite `PRAGMA foreign_keys` y est sans effet.

## Migrations et seeders

```bash
make migrate        # migrations incrémentales
make migrate-fresh  # supprimer et reconstruire depuis zéro
make seed           # données de démonstration
```

Le seeder crée **deux organisations**, chacune avec 2 professeurs et leurs comptes, 3 matières, 4 groupes, 5 tuteurs, 8 élèves, 11 inscriptions, 10 séances, 24 présences et 21 paiements.

Les index de performance sont composés, avec `organization_id` en **première** colonne : puisque toute requête filtre désormais par organisation, un index sur la seule colonne `status` ne serait plus sélectif.

### Migrer une installation existante

La bascule vers le multi-organisation se fait en cinq migrations enchaînées, chacune laissant le système opérationnel. La procédure complète — sauvegarde vérifiée, comptages avant/après, exécution et retour arrière — est décrite dans **[docs/migration-multi-org.md](docs/migration-multi-org.md)**.

```bash
make migrate          # applique la bascule
make verify-tenancy   # aucune ligne sans organisation ; code de sortie ≠ 0 sinon
```

## Structure du projet

```
refuerzo-elite-v2/
├── backend/                  # Laravel 12
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Http/Middleware/EnsureTenantContext.php   # résout l'organisation active
│   │   ├── Models/Concerns/BelongsToOrganization.php # filtre + remplissage auto
│   │   ├── Models/Scopes/OrganizationScope.php       # le global scope
│   │   ├── Policies/                                 # qui, dans le centre, peut quoi
│   │   ├── Rules/BelongsToCurrentOrganization.php    # `exists` conscient du tenant
│   │   └── Support/OrganizationContext.php
│   ├── database/migrations/
│   ├── database/seeders/
│   ├── lang/es/              # textes utilisateur (espagnol par défaut)
│   └── tests/Feature/
├── frontend/                 # React 19 + Vite
│   └── src/
│       ├── context/
│       ├── pages/
│       └── components/
├── docker/
│   ├── nginx/default.conf
│   └── php/Dockerfile
├── docker-compose.yml
├── docker-compose.override.yml
├── Makefile
└── .env.docker.example
```

## Variables d'environnement

Copier `.env.docker.example` en `.env.docker` et remplir les valeurs. Ce fichier est dans `.gitignore` et ne doit jamais être commité.

Les variables à changer sont `APP_KEY`, les identifiants MySQL et `ADMIN_PASSWORD`.
