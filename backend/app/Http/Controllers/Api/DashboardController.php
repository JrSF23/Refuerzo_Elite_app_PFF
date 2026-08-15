<?php

namespace App\Http\Controllers\Api;

use App\Models\Attendance;
use App\Models\ClassGroup;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Student;
use App\Models\Teacher;
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

    private function adminDashboard(): JsonResponse
    {
        return response()->json([
            // Discriminador de vista, no el nombre del rol: el frontend solo
            // comprueba `=== 'teacher'` y todo lo demás cae en la vista de
            // administración. Se conserva el valor para no cambiar la forma de la
            // respuesta sin necesidad (FR-026).
            'role'           => 'admin',
            'stats'          => [
                'students'   => Student::count(),
                'teachers'   => Teacher::count(),
                'groups'     => ClassGroup::count(),
                'attendances'=> Attendance::count(),
                'payments'   => Payment::count(),
            ],
            'recentStudents' => Student::with('guardian')->latest()->take(5)->get(),
            'recentSessions' => ClassSession::with(['classGroup.subject', 'classGroup.teacher'])
                ->orderByDesc('session_date')
                ->take(5)
                ->get(),
            'recentPayments' => Payment::with(['student', 'guardian'])->latest()->take(5)->get(),
        ]);
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
