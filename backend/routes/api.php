<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassGroupController;
use App\Http\Controllers\Api\ClassSessionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\GuardianController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\TutorGroupController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // ── Rutas de plataforma ──────────────────────────────────────────────
        // Van FUERA de 'tenant': el super_admin no pertenece a ninguna
        // organización, así que no puede establecer contexto de tenant.
        Route::middleware('role.any:super_admin')->group(function (): void {
            Route::post('/organizations/{id}/suspend', [OrganizationController::class, 'suspend']);
            Route::post('/organizations/{id}/activate', [OrganizationController::class, 'activate']);
            Route::apiResource('organizations', OrganizationController::class);
        });

        // El alcance depende del rol: el super_admin ve cuentas de cualquier
        // organización; el org_admin, solo las de la suya (US4).
        Route::middleware('role.any:super_admin,org_admin')->group(function (): void {
            Route::apiResource('users', UserController::class);
        });

        // ── Rutas de negocio ─────────────────────────────────────────────────
        // Todas llevan 'tenant': sin organización activa no se llega a ninguna.
        Route::middleware(['tenant', 'role.any:org_admin,teacher'])->group(function (): void {
            Route::get('/dashboard', DashboardController::class);

            Route::apiResource('students', StudentController::class)->only(['index', 'show']);
            // El profesor consulta los grupos tutoriales; no los modifica. Es la
            // primera entidad con lectura sin escritura para él, y puede tenerla
            // porque no lleva ningún campo monetario.
            Route::apiResource('tutor-groups', TutorGroupController::class)->only(['index', 'show']);
            Route::apiResource('class-groups', ClassGroupController::class)->only(['index', 'show']);
            // Acto propio y deliberado, no un campo del formulario: marcar una
            // sesión como impartida es DEFINITIVO. Va antes del apiResource por
            // legibilidad; no colisiona con ninguna de sus rutas.
            Route::post('/class-sessions/{id}/taught', [ClassSessionController::class, 'markTaught']);
            Route::apiResource('class-sessions', ClassSessionController::class);
            Route::apiResource('attendances', AttendanceController::class);
        });

        Route::middleware(['tenant', 'role.any:org_admin'])->group(function (): void {
            Route::apiResource('guardians', GuardianController::class);
            Route::apiResource('teachers', TeacherController::class);
            Route::apiResource('subjects', SubjectController::class);
            Route::apiResource('students', StudentController::class)->except(['index', 'show']);
            Route::apiResource('tutor-groups', TutorGroupController::class)->except(['index', 'show']);
            Route::apiResource('class-groups', ClassGroupController::class)->except(['index', 'show']);
            Route::apiResource('enrollments', EnrollmentController::class);
            Route::apiResource('payments', PaymentController::class);
        });
    });
});
