# Refuerzo Elite V2

Aplicacion web moderna para la gestion y administracion de un centro de apoyo escolar.

## Stack

- Frontend: React + Vite + React Router + Axios
- Backend: Laravel 12 + Sanctum + Spatie Permission
- Base principal: MySQL
- Persistencia complementaria: MongoDB reservada para auditoria avanzada cuando exista la infraestructura necesaria

## Estructura

- `backend/`: API REST con autenticacion, roles, migraciones y seeders
- `frontend/`: interfaz moderna para login, dashboard y modulos CRUD
- `README.md`: resumen general
- `docs/IMPLEMENTATION.md`: documentacion detallada del trabajo realizado

## Credenciales iniciales

- Usuario: `admin`
- Correo: `admin@refuerzoelite.test`
- Contrasena: `Admin12345!`

## Arranque rapido

### Backend

```powershell
cd backend
php artisan serve
```

La API quedara disponible en `http://127.0.0.1:8000/api/v1`.

### Frontend

```powershell
cd frontend
npm.cmd run dev
```

El frontend quedara disponible en `http://127.0.0.1:5173`.

## Base de datos

El backend ya esta preparado para MySQL con esta base:

- Base: `refuerzo_elite_v2`
- Host: `127.0.0.1`
- Puerto: `3306`
- Usuario: `root`

## Estado actual del MVP

- Login por API con token
- Dashboard inicial con metricas
- CRUD API para alumnos, tutores, profesores, materias, grupos, inscripciones, sesiones, asistencias y pagos
- Frontend con shell moderna y pantallas CRUD reutilizables por modulo

## Documentacion detallada

Revisa [docs/IMPLEMENTATION.md](C:/xampp/htdocs/Refuerzo_Elite-Project/refuerzo-elite-v2/docs/IMPLEMENTATION.md).
