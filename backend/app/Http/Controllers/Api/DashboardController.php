<?php

namespace App\Http\Controllers\Api;

use App\Models\Attendance;
use App\Models\ClassGroup;
use App\Models\ClassSession;
use App\Models\Payment;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController
{
    public function __invoke(Request $request): JsonResponse
    {
        $isAdmin = $request->user()?->hasRole('admin');

        $stats = [
            'students' => Student::count(),
            'teachers' => Teacher::count(),
            'groups' => ClassGroup::count(),
            'attendances' => Attendance::count(),
        ];

        if ($isAdmin) {
            $stats['payments'] = Payment::count();
        }

        return response()->json([
            'stats' => $stats,
            'recentStudents' => Student::with('guardian')->latest()->take(5)->get(),
            'recentSessions' => ClassSession::with(['classGroup.subject', 'classGroup.teacher'])
                ->orderByDesc('session_date')
                ->take(5)
                ->get(),
            'recentPayments' => $isAdmin
                ? Payment::with(['student', 'guardian'])->latest()->take(5)->get()
                : [],
        ]);
    }
}
