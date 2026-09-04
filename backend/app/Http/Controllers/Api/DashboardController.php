<?php

namespace App\Http\Controllers\Api;

use App\Models\Attendance;
use App\Models\ClassGroup;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Teacher;
use App\Support\AdminDashboard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasRole('teacher')) {
            return $this->teacherDashboard($user);
        }

        return $this->adminDashboard();
    }

    /**
     * El panel de administración es un centro de control, no un escaparate de
     * tablas: cada dato está para responder a «cómo va el centro» y «qué tengo
     * que atender hoy».
     *
     * Los números se agregan en `App\Support\AdminDashboard`, contra la base y
     * no sobre lo que quepa en una página. Aquí solo se decide QUIÉN pregunta.
     *
     * Ya no se devuelve `recentSessions`: las próximas sesiones son trabajo del
     * módulo de Sesiones, y en el panel del administrador ocupaban el sitio de lo
     * que sí necesita mirar.
     */
    private function adminDashboard(): JsonResponse
    {
        return response()->json(app(AdminDashboard::class)->payload());
    }

    private function teacherDashboard($user): JsonResponse
    {
        // El vínculo es teachers.user_id, no el email (D6). Emparejar por correo
        // era frágil —`teachers.email` es nullable y un cambio de correo rompía el
        // vínculo en silencio— y convertirlo en regla de acceso sería un fallo de
        // seguridad.
        $teacher = Teacher::where('user_id', $user->id)->first();

        if (! $teacher) {
            // Usuario con rol profesor sin ficha vinculada: cero grupos, cero
            // alumnos. El fallo cierra el acceso, nunca lo abre (FR-015c).
            return response()->json([
                'role'               => 'teacher',
                'teacher'            => null,
                'stats'              => ['groups' => 0, 'students' => 0, 'upcoming_sessions' => 0],
                'myGroups'           => [],
                'upcomingSessions'   => [],
                'recentAttendances'  => [],
            ]);
        }

        $myGroups = ClassGroup::where('teacher_id', $teacher->id)
            ->with('subject')
            ->orderBy('name')
            ->get();

        $myGroupIds = $myGroups->pluck('id');

        $upcomingSessions = ClassSession::whereIn('class_group_id', $myGroupIds)
            ->where('session_date', '>=', today())
            ->with('classGroup.subject')
            ->orderBy('session_date')
            ->orderBy('starts_at')
            ->take(8)
            ->get();

        $studentCount = Enrollment::whereIn('class_group_id', $myGroupIds)
            ->where('status', 'active')
            ->distinct('student_id')
            ->count('student_id');

        $recentAttendances = Attendance::whereHas(
            'classSession',
            fn ($q) => $q->whereIn('class_group_id', $myGroupIds)
        )
            ->with(['student', 'classSession.classGroup'])
            ->latest()
            ->take(8)
            ->get();

        return response()->json([
            'role'              => 'teacher',
            'teacher'           => $teacher,
            'stats'             => [
                'groups'            => $myGroups->count(),
                'students'          => $studentCount,
                'upcoming_sessions' => $upcomingSessions->count(),
            ],
            'myGroups'          => $myGroups,
            'upcomingSessions'  => $upcomingSessions,
            'recentAttendances' => $recentAttendances,
        ]);
    }
}
