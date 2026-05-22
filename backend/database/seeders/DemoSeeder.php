<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\ClassGroup;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Guardian;
use App\Models\Payment;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // ── Roles ────────────────────────────────────────────────────────────
        foreach (['admin', 'teacher', 'student'] as $roleName) {
            Role::findOrCreate($roleName, 'web');
        }

        // ── Profesores con cuenta de usuario ─────────────────────────────────
        $teacher1 = Teacher::create([
            'first_name' => 'María',
            'last_name'  => 'García López',
            'email'      => 'mgarcia@refuerzoelite.test',
            'phone'      => '612345678',
            'specialty'  => 'Matemáticas y Física',
            'bio'        => 'Licenciada en Matemáticas con 8 años de experiencia en refuerzo escolar.',
        ]);

        $teacher2 = Teacher::create([
            'first_name' => 'Carlos',
            'last_name'  => 'Martínez Ruiz',
            'email'      => 'cmartinez@refuerzoelite.test',
            'phone'      => '623456789',
            'specialty'  => 'Lengua y Literatura',
            'bio'        => 'Profesor de Secundaria, especialista en comprensión lectora y escritura.',
        ]);

        $userTeacher1 = User::updateOrCreate(
            ['email' => $teacher1->email],
            [
                'name'      => $teacher1->first_name.' '.$teacher1->last_name,
                'username'  => 'mgarcia',
                'password'  => 'Teacher12345!',
                'is_active' => true,
            ]
        );
        $userTeacher1->syncRoles(['teacher']);

        $userTeacher2 = User::updateOrCreate(
            ['email' => $teacher2->email],
            [
                'name'      => $teacher2->first_name.' '.$teacher2->last_name,
                'username'  => 'cmartinez',
                'password'  => 'Teacher12345!',
                'is_active' => true,
            ]
        );
        $userTeacher2->syncRoles(['teacher']);

        // ── Materias ──────────────────────────────────────────────────────────
        $mates = Subject::create([
            'name'        => 'Matemáticas',
            'code'        => 'MAT',
            'level'       => 'ESO / Bachillerato',
            'monthly_fee' => 80.00,
            'description' => 'Refuerzo de álgebra, geometría y cálculo.',
        ]);

        $lengua = Subject::create([
            'name'        => 'Lengua Castellana',
            'code'        => 'LEN',
            'level'       => 'Primaria / ESO',
            'monthly_fee' => 70.00,
            'description' => 'Comprensión lectora, gramática y expresión escrita.',
        ]);

        $ingles = Subject::create([
            'name'        => 'Inglés',
            'code'        => 'ING',
            'level'       => 'Todos los niveles',
            'monthly_fee' => 75.00,
            'description' => 'Cambridge, B1/B2 y conversación.',
        ]);

        // ── Grupos ────────────────────────────────────────────────────────────
        $groupMatesA = ClassGroup::create([
            'subject_id'    => $mates->id,
            'teacher_id'    => $teacher1->id,
            'name'          => 'Matemáticas — Grupo A',
            'code'          => 'MAT-A',
            'academic_year' => '2025-2026',
            'schedule'      => 'Lunes y miércoles 17:00–18:30',
            'capacity'      => 12,
            'start_date'    => '2025-09-16',
            'end_date'      => '2026-06-15',
            'status'        => 'active',
        ]);

        $groupMatesB = ClassGroup::create([
            'subject_id'    => $mates->id,
            'teacher_id'    => $teacher1->id,
            'name'          => 'Matemáticas — Grupo B',
            'code'          => 'MAT-B',
            'academic_year' => '2025-2026',
            'schedule'      => 'Martes y jueves 18:30–20:00',
            'capacity'      => 10,
            'start_date'    => '2025-09-16',
            'end_date'      => '2026-06-15',
            'status'        => 'active',
        ]);

        $groupLengua = ClassGroup::create([
            'subject_id'    => $lengua->id,
            'teacher_id'    => $teacher2->id,
            'name'          => 'Lengua — Grupo Mañana',
            'code'          => 'LEN-M',
            'academic_year' => '2025-2026',
            'schedule'      => 'Sábados 10:00–11:30',
            'capacity'      => 8,
            'start_date'    => '2025-09-20',
            'end_date'      => '2026-06-13',
            'status'        => 'active',
        ]);

        $groupIngles = ClassGroup::create([
            'subject_id'    => $ingles->id,
            'teacher_id'    => null,
            'name'          => 'Inglés B2 — Grupo Tarde',
            'code'          => 'ING-T',
            'academic_year' => '2025-2026',
            'schedule'      => 'Viernes 16:00–17:30',
            'capacity'      => 10,
            'start_date'    => '2025-09-19',
            'end_date'      => '2026-06-12',
            'status'        => 'active',
        ]);

        // ── Tutores ───────────────────────────────────────────────────────────
        $guardians = [
            Guardian::create(['first_name' => 'Rosa',    'last_name' => 'Fernández Pérez', 'email' => 'r.fernandez@email.com', 'phone' => '634111222', 'relationship_label' => 'Madre']),
            Guardian::create(['first_name' => 'Antonio', 'last_name' => 'López Jiménez',   'email' => 'a.lopez@email.com',     'phone' => '634222333', 'relationship_label' => 'Padre']),
            Guardian::create(['first_name' => 'Elena',   'last_name' => 'Sánchez Gómez',   'email' => 'e.sanchez@email.com',   'phone' => '634333444', 'relationship_label' => 'Madre']),
            Guardian::create(['first_name' => 'Pablo',   'last_name' => 'Moreno Castro',   'email' => 'p.moreno@email.com',    'phone' => '634444555', 'relationship_label' => 'Padre']),
            Guardian::create(['first_name' => 'Luisa',   'last_name' => 'Díaz Herrera',    'email' => 'l.diaz@email.com',      'phone' => '634555666', 'relationship_label' => 'Madre']),
        ];

        // ── Alumnos ───────────────────────────────────────────────────────────
        $students = [
            Student::create(['guardian_id' => $guardians[0]->id, 'first_name' => 'Lucía',    'last_name' => 'Fernández Pérez', 'date_of_birth' => '2010-03-15', 'school_name' => 'IES Ramón y Cajal',   'school_level' => '4º ESO',      'status' => 'active']),
            Student::create(['guardian_id' => $guardians[0]->id, 'first_name' => 'Alejandro','last_name' => 'Fernández Pérez', 'date_of_birth' => '2012-07-22', 'school_name' => 'IES Ramón y Cajal',   'school_level' => '2º ESO',      'status' => 'active']),
            Student::create(['guardian_id' => $guardians[1]->id, 'first_name' => 'Sofía',    'last_name' => 'López Jiménez',   'date_of_birth' => '2009-11-08', 'school_name' => 'Colegio San Pedro',   'school_level' => '1º Bachiller', 'status' => 'active']),
            Student::create(['guardian_id' => $guardians[2]->id, 'first_name' => 'Diego',    'last_name' => 'Sánchez Gómez',   'date_of_birth' => '2011-01-30', 'school_name' => 'CEIP Mediterráneo',  'school_level' => '6º Primaria', 'status' => 'active']),
            Student::create(['guardian_id' => $guardians[3]->id, 'first_name' => 'Isabel',   'last_name' => 'Moreno Castro',   'date_of_birth' => '2010-09-05', 'school_name' => 'IES Victoria Kent',  'school_level' => '4º ESO',      'status' => 'active']),
            Student::create(['guardian_id' => $guardians[3]->id, 'first_name' => 'Marcos',   'last_name' => 'Moreno Castro',   'date_of_birth' => '2013-04-18', 'school_name' => 'CEIP Mediterráneo',  'school_level' => '4º Primaria', 'status' => 'active']),
            Student::create(['guardian_id' => $guardians[4]->id, 'first_name' => 'Carmen',   'last_name' => 'Díaz Herrera',    'date_of_birth' => '2008-12-10', 'school_name' => 'Colegio San Pedro',   'school_level' => '2º Bachiller', 'status' => 'active']),
            Student::create(['guardian_id' => $guardians[4]->id, 'first_name' => 'Javier',   'last_name' => 'Díaz Herrera',    'date_of_birth' => '2011-06-25', 'school_name' => 'IES Victoria Kent',  'school_level' => '1º ESO',      'status' => 'inactive']),
        ];

        // ── Inscripciones ─────────────────────────────────────────────────────
        $enrollments = [
            // Lucía → Mates A + Inglés
            Enrollment::create(['student_id' => $students[0]->id, 'class_group_id' => $groupMatesA->id, 'enrolled_at' => '2025-09-16', 'monthly_fee' => 80.00, 'status' => 'active']),
            Enrollment::create(['student_id' => $students[0]->id, 'class_group_id' => $groupIngles->id, 'enrolled_at' => '2025-09-19', 'monthly_fee' => 75.00, 'status' => 'active']),
            // Alejandro → Mates A
            Enrollment::create(['student_id' => $students[1]->id, 'class_group_id' => $groupMatesA->id, 'enrolled_at' => '2025-09-16', 'monthly_fee' => 80.00, 'status' => 'active']),
            // Sofía → Mates B + Inglés
            Enrollment::create(['student_id' => $students[2]->id, 'class_group_id' => $groupMatesB->id, 'enrolled_at' => '2025-09-16', 'monthly_fee' => 80.00, 'status' => 'active']),
            Enrollment::create(['student_id' => $students[2]->id, 'class_group_id' => $groupIngles->id, 'enrolled_at' => '2025-09-19', 'monthly_fee' => 75.00, 'status' => 'active']),
            // Diego → Lengua
            Enrollment::create(['student_id' => $students[3]->id, 'class_group_id' => $groupLengua->id, 'enrolled_at' => '2025-09-20', 'monthly_fee' => 70.00, 'status' => 'active']),
            // Isabel → Mates B
            Enrollment::create(['student_id' => $students[4]->id, 'class_group_id' => $groupMatesB->id, 'enrolled_at' => '2025-09-16', 'monthly_fee' => 80.00, 'status' => 'active']),
            // Marcos → Lengua
            Enrollment::create(['student_id' => $students[5]->id, 'class_group_id' => $groupLengua->id, 'enrolled_at' => '2025-09-20', 'monthly_fee' => 70.00, 'status' => 'active']),
            // Carmen → Mates A + Inglés
            Enrollment::create(['student_id' => $students[6]->id, 'class_group_id' => $groupMatesA->id, 'enrolled_at' => '2025-09-16', 'monthly_fee' => 80.00, 'status' => 'active']),
            Enrollment::create(['student_id' => $students[6]->id, 'class_group_id' => $groupIngles->id, 'enrolled_at' => '2025-09-19', 'monthly_fee' => 75.00, 'status' => 'active']),
            // Javier → inactivo, inscripción inactiva
            Enrollment::create(['student_id' => $students[7]->id, 'class_group_id' => $groupMatesA->id, 'enrolled_at' => '2025-09-16', 'monthly_fee' => 80.00, 'status' => 'inactive']),
        ];

        // ── Sesiones de clase ─────────────────────────────────────────────────
        $sessionsMatesA = [];
        $dates = ['2026-01-13', '2026-01-15', '2026-01-20', '2026-01-22'];
        foreach ($dates as $i => $date) {
            $sessionsMatesA[] = ClassSession::create([
                'class_group_id' => $groupMatesA->id,
                'title'          => 'Sesión '.($i + 1).' — Álgebra lineal',
                'session_date'   => $date,
                'starts_at'      => '17:00:00',
                'ends_at'        => '18:30:00',
                'room'           => 'Aula 1',
            ]);
        }

        $sessionsMatesB = [];
        $datesB = ['2026-01-13', '2026-01-15', '2026-01-20'];
        foreach ($datesB as $i => $date) {
            $sessionsMatesB[] = ClassSession::create([
                'class_group_id' => $groupMatesB->id,
                'title'          => 'Sesión '.($i + 1).' — Funciones y derivadas',
                'session_date'   => $date,
                'starts_at'      => '18:30:00',
                'ends_at'        => '20:00:00',
                'room'           => 'Aula 2',
            ]);
        }

        $sessionsLengua = [];
        $datesL = ['2026-01-10', '2026-01-17', '2026-01-24'];
        foreach ($datesL as $i => $date) {
            $sessionsLengua[] = ClassSession::create([
                'class_group_id' => $groupLengua->id,
                'title'          => 'Sesión '.($i + 1).' — Comprensión lectora',
                'session_date'   => $date,
                'starts_at'      => '10:00:00',
                'ends_at'        => '11:30:00',
                'room'           => 'Aula 3',
            ]);
        }

        // ── Asistencias ───────────────────────────────────────────────────────
        // Alumnos de Mates A: students[0] (Lucía), [1] (Alejandro), [6] (Carmen)
        $matesAStudents = [$students[0], $students[1], $students[6]];
        $attendanceStatuses = ['present', 'present', 'present', 'absent', 'present', 'late', 'present', 'present', 'present', 'present', 'absent', 'present'];
        $attendanceIndex = 0;
        foreach ($sessionsMatesA as $session) {
            foreach ($matesAStudents as $student) {
                Attendance::create([
                    'class_session_id' => $session->id,
                    'student_id'       => $student->id,
                    'status'           => $attendanceStatuses[$attendanceIndex % count($attendanceStatuses)],
                ]);
                $attendanceIndex++;
            }
        }

        // Alumnos de Mates B: students[2] (Sofía), [4] (Isabel)
        $matesBStudents = [$students[2], $students[4]];
        foreach ($sessionsMatesB as $session) {
            foreach ($matesBStudents as $student) {
                Attendance::create([
                    'class_session_id' => $session->id,
                    'student_id'       => $student->id,
                    'status'           => 'present',
                ]);
            }
        }

        // Alumnos de Lengua: students[3] (Diego), [5] (Marcos)
        $lenguaStudents = [$students[3], $students[5]];
        $lenguaStatuses = ['present', 'absent', 'present', 'present', 'present', 'present'];
        $li = 0;
        foreach ($sessionsLengua as $session) {
            foreach ($lenguaStudents as $student) {
                Attendance::create([
                    'class_session_id' => $session->id,
                    'student_id'       => $student->id,
                    'status'           => $lenguaStatuses[$li % count($lenguaStatuses)],
                ]);
                $li++;
            }
        }

        // ── Pagos (oct–dic 2025 + ene 2026) ──────────────────────────────────
        $paymentData = [
            // Lucía — Mates A (enc.[0]) + Inglés (enc.[1])
            [$students[0], $guardians[0], $enrollments[0], 80.00, 'Octubre 2025',    '2025-10-05', 'cash',     'paid'],
            [$students[0], $guardians[0], $enrollments[0], 80.00, 'Noviembre 2025',  '2025-11-04', 'card',     'paid'],
            [$students[0], $guardians[0], $enrollments[0], 80.00, 'Diciembre 2025',  '2025-12-03', 'cash',     'paid'],
            [$students[0], $guardians[0], $enrollments[0], 80.00, 'Enero 2026',      '2026-01-07', 'transfer', 'paid'],
            [$students[0], $guardians[0], $enrollments[1], 75.00, 'Octubre 2025',    '2025-10-05', 'cash',     'paid'],
            [$students[0], $guardians[0], $enrollments[1], 75.00, 'Noviembre 2025',  '2025-11-04', 'cash',     'paid'],
            // Sofía — Mates B (enc.[3])
            [$students[2], $guardians[1], $enrollments[3], 80.00, 'Octubre 2025',    '2025-10-06', 'card',     'paid'],
            [$students[2], $guardians[1], $enrollments[3], 80.00, 'Noviembre 2025',  '2025-11-05', 'card',     'paid'],
            [$students[2], $guardians[1], $enrollments[3], 80.00, 'Diciembre 2025',  '2025-12-04', 'card',     'paid'],
            [$students[2], $guardians[1], $enrollments[3], 80.00, 'Enero 2026',      '2026-01-08', 'card',     'pending'],
            // Diego — Lengua (enc.[5])
            [$students[3], $guardians[2], $enrollments[5], 70.00, 'Octubre 2025',    '2025-10-07', 'cash',     'paid'],
            [$students[3], $guardians[2], $enrollments[5], 70.00, 'Noviembre 2025',  '2025-11-06', 'cash',     'paid'],
            [$students[3], $guardians[2], $enrollments[5], 70.00, 'Diciembre 2025',  '2025-12-05', 'cash',     'paid'],
            [$students[3], $guardians[2], $enrollments[5], 70.00, 'Enero 2026',      null,         'cash',     'pending'],
            // Isabel — Mates B (enc.[6])
            [$students[4], $guardians[3], $enrollments[6], 80.00, 'Octubre 2025',    '2025-10-06', 'transfer', 'paid'],
            [$students[4], $guardians[3], $enrollments[6], 80.00, 'Noviembre 2025',  '2025-11-05', 'transfer', 'paid'],
            [$students[4], $guardians[3], $enrollments[6], 80.00, 'Diciembre 2025',  '2025-12-04', 'transfer', 'paid'],
            // Carmen — Mates A + Inglés (enc.[8], enc.[9])
            [$students[6], $guardians[4], $enrollments[8], 80.00, 'Octubre 2025',    '2025-10-05', 'cash',     'paid'],
            [$students[6], $guardians[4], $enrollments[8], 80.00, 'Noviembre 2025',  '2025-11-04', 'cash',     'paid'],
            [$students[6], $guardians[4], $enrollments[9], 75.00, 'Noviembre 2025',  '2025-11-04', 'cash',     'paid'],
            [$students[6], $guardians[4], $enrollments[8], 80.00, 'Diciembre 2025',  '2025-12-03', 'cash',     'cancelled'],
        ];

        foreach ($paymentData as $row) {
            [$student, $guardian, $enrollment, $amount, $period, $paidAt, $method, $status] = $row;
            Payment::create([
                'student_id'     => $student->id,
                'guardian_id'    => $guardian->id,
                'enrollment_id'  => $enrollment->id,
                'amount'         => $amount,
                'period_label'   => $period,
                'paid_at'        => $paidAt ?? now()->toDateString(),
                'payment_method' => $method,
                'status'         => $status,
            ]);
        }
    }
}
