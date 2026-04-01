<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassGroupController;
use App\Http\Controllers\Api\ClassSessionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\GuardianController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TeacherController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::middleware('role.any:admin,teacher')->group(function (): void {
            Route::get('/dashboard', DashboardController::class);

            Route::apiResource('students', StudentController::class)->only(['index', 'show']);
            Route::apiResource('class-groups', ClassGroupController::class)->only(['index', 'show']);
            Route::apiResource('class-sessions', ClassSessionController::class);
            Route::apiResource('attendances', AttendanceController::class);
        });

        Route::middleware('role.any:admin')->group(function (): void {
            Route::apiResource('guardians', GuardianController::class);
            Route::apiResource('teachers', TeacherController::class);
            Route::apiResource('subjects', SubjectController::class);
            Route::apiResource('students', StudentController::class)->except(['index', 'show']);
            Route::apiResource('class-groups', ClassGroupController::class)->except(['index', 'show']);
            Route::apiResource('enrollments', EnrollmentController::class);
            Route::apiResource('payments', PaymentController::class);
        });
    });
});
