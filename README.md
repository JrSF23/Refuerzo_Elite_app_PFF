# Refuerzo Elite V2

Système de gestion pour un centre de soutien scolaire. Couvre le cycle complet : élèves, tuteurs, professeurs, groupes, séances, présences et paiements. Deux profils d'accès : administration et professeur, avec des vues distinctes selon le rôle.

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

| Utilisateur | Mot de passe | Rôle |
|---|---|---|
| `admin` | `Admin12345!` | Administrateur |
| `mgarcia` | `Teacher12345!` | Professeur |
| `cmartinez` | `Teacher12345!` | Professeur |

## API

Base : `/api/v1`

Authentification par token Bearer (Sanctum). Tous les endpoints protégés nécessitent `Authorization: Bearer <token>`.

| Module | Endpoint | Notes |
|---|---|---|
| Auth | `POST /login`, `GET /me`, `POST /logout` | Login par username ou email |
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

**Admin :** métriques globales (élèves actifs, groupes, recettes du mois, prochaines séances) et accès à tous les modules.

**Professeur :** ses groupes assignés, ses prochaines séances, les présences récentes de ses élèves et les statistiques de sa classe. Le profil est relié par email entre le compte utilisateur et l'enregistrement professeur.

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

34 tests au total :

- `AuthTest` (10 tests) — login par email et username, rôles, tokens, `/me`, logout
- `StudentTest` (14 tests) — CRUD complet, permissions par rôle, validations, soft delete
- `PaymentTest` (10 tests) — création, validation d'inscription croisée, méthodes de paiement, soft delete

Tous utilisent `RefreshDatabase` pour travailler sur une base propre à chaque test.

## Migrations et seeders

```bash
make migrate        # migrations incrémentales
make migrate-fresh  # supprimer et reconstruire depuis zéro
make seed           # données de démonstration
```

Le seeder crée 2 professeurs avec leurs comptes, 3 matières, 4 groupes, 5 tuteurs, 8 élèves, 11 inscriptions, 10 séances, environ 30 présences et 21 paiements.

Une migration d'index de performance couvre les colonnes les plus consultées : `status`, `paid_at`, `session_date`, `academic_year` et les clés étrangères d'audit.

## Structure du projet

```
refuerzo-elite-v2/
├── backend/                  # Laravel 12
│   ├── app/Http/Controllers/Api/
│   ├── database/migrations/
│   ├── database/seeders/
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
