<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\ClassGroup;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Guardian;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TutorGroup;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

/**
 * Datos de demostración para DOS organizaciones.
 *
 * Que sean dos y no una es deliberado: el aislamiento solo es comprobable a mano
 * si hay algo de lo que aislarse. Ambas usan los MISMOS códigos de asignatura y de
 * grupo (MAT, LEN, ING, MAT-A…) y correos de alumno repetidos, que es justo lo que
 * FR-019 exige que sea posible.
 *
 * Los modelos aún no llevan el trait de tenancy, así que `organization_id` se fija
 * explícitamente con forceCreate: no está en $fillable a propósito, para que jamás
 * pueda llegar desde una petición.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['super_admin', 'org_admin', 'teacher'] as $roleName) {
            Role::findOrCreate($roleName, 'web');
        }

        // Organización del centro actual, creada por M1.
        $centroA = Organization::query()->orderBy('id')->firstOrFail();

        $centroB = Organization::query()->firstOrCreate(
            ['slug' => 'centro-piloto-malabo'],
            [
                'name' => 'Centro Piloto Malabo',
                'status' => Organization::STATUS_ACTIVE,
                'contact_email' => 'contacto@centropiloto.test',
            ]
        );

        $this->seedOrganization($centroA, 'a', [
            ['María', 'García López', 'mgarcia', 'Matemáticas y Física'],
            ['Carlos', 'Martínez Ruiz', 'cmartinez', 'Lengua y Literatura'],
        ]);

        $this->seedOrganization($centroB, 'b', [
            ['Lucía', 'Nvono Obiang', 'lnvono', 'Matemáticas'],
            ['Tomás', 'Ela Mangue', 'tela', 'Inglés'],
        ]);
    }

    /**
     * @param  list<array{0: string, 1: string, 2: string, 3: string}>  $teacherData
     */
    private function seedOrganization(Organization $organization, string $suffix, array $teacherData): void
    {
        $orgId = $organization->getKey();

        // ── Administrador de la organización ─────────────────────────────────
        $orgAdmin = User::query()->updateOrCreate(
            ['email' => "admin.{$suffix}@refuerzoelite.test"],
            [
                'name' => 'Administración '.$organization->name,
                'username' => "admin.{$suffix}",
                'password' => 'Admin12345!',
                'is_active' => true,
            ]
        );
        $orgAdmin->forceFill(['organization_id' => $orgId])->save();
        $orgAdmin->syncRoles(['org_admin']);

        // ── Profesores con ficha y cuenta vinculadas ─────────────────────────
        $teachers = [];

        foreach ($teacherData as $index => [$firstName, $lastName, $username, $specialty]) {
            // El email de la cuenta es único global; el de la ficha, único por
            // organización. Son campos distintos a propósito.
            $account = User::query()->updateOrCreate(
                ['email' => "{$username}.{$suffix}@refuerzoelite.test"],
                [
                    'name' => "{$firstName} {$lastName}",
                    'username' => "{$username}.{$suffix}",
                    'password' => 'Teacher12345!',
                    'is_active' => true,
                ]
            );
            $account->forceFill(['organization_id' => $orgId])->save();
            $account->syncRoles(['teacher']);

            $teachers[$index] = Teacher::forceCreate([
                'organization_id' => $orgId,
                'user_id' => $account->getKey(),
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => "{$username}@centro.test", // se repite entre organizaciones
                'phone' => '61234567'.$index,
                'specialty' => $specialty,
            ]);
        }

        // ── Materias — mismos códigos en ambas organizaciones ────────────────
        $subjects = [];

        foreach ([
            ['Matemáticas', 'MAT', 'ESO / Bachillerato'],
            ['Lengua Castellana', 'LEN', 'Primaria / ESO'],
            ['Inglés', 'ING', 'Todos los niveles'],
        ] as $index => [$name, $code, $level]) {
            // Sin importe: la asignatura dejó de ser unidad de cobro. La cuota
            // se pacta en la matrícula, más abajo.
            $subjects[$index] = Subject::forceCreate([
                'organization_id' => $orgId,
                'name' => $name,
                'code' => $code,
                'level' => $level,
            ]);
        }

        // ── Grupos — mismos códigos en ambas organizaciones ──────────────────
        $groups = [];

        foreach ([
            [0, 0, 'Matemáticas — Grupo A', 'MAT-A', 'Lunes y miércoles 17:00–18:30', 12],
            [0, 0, 'Matemáticas — Grupo B', 'MAT-B', 'Martes y jueves 18:30–20:00', 10],
            [1, 1, 'Lengua — Grupo Mañana', 'LEN-M', 'Sábados 10:00–11:30', 8],
            [2, null, 'Inglés B2 — Grupo Tarde', 'ING-T', 'Viernes 16:00–17:30', 10],
        ] as $index => [$subjectIndex, $teacherIndex, $name, $code, $schedule, $capacity]) {
            $groups[$index] = ClassGroup::forceCreate([
                'organization_id' => $orgId,
                'subject_id' => $subjects[$subjectIndex]->getKey(),
                'teacher_id' => $teacherIndex === null ? null : $teachers[$teacherIndex]->getKey(),
                'name' => $name,
                'code' => $code,
                'academic_year' => '2025-2026',
                'schedule' => $schedule,
                'capacity' => $capacity,
                'start_date' => '2025-09-16',
                'end_date' => '2026-06-15',
                'status' => 'active',
            ]);
        }

        /*
         * ── Materia de cada ficha de profesor ────────────────────────────────
         *
         * Se deduce de sus grupos, igual que el backfill de la migración. Un
         * profesor alcanza un grupo cuando lo tiene asignado Y la materia del
         * grupo es la de su ficha, así que sin este paso las cuentas de profesor
         * de la demo entrarían y no verían nada.
         *
         * Se hace aquí, después de los grupos, y no al crear la ficha, para que
         * la fuente sea una sola: si mañana cambia el reparto de grupos de
         * arriba, la materia lo sigue sin que haya que acordarse de tocarla.
         */
        foreach ($groups as $group) {
            if ($group->teacher_id === null) {
                continue;
            }

            Teacher::query()
                ->whereKey($group->teacher_id)
                ->whereNull('subject_id')
                ->update(['subject_id' => $group->subject_id]);
        }

        // ── Tutores ──────────────────────────────────────────────────────────
        $guardians = [];

        foreach ([
            ['Rosa', 'Fernández Pérez', 'r.fernandez@email.com', 'Madre'],
            ['Antonio', 'López Jiménez', 'a.lopez@email.com', 'Padre'],
            ['Elena', 'Sánchez Gómez', 'e.sanchez@email.com', 'Madre'],
            ['Pablo', 'Moreno Castro', 'p.moreno@email.com', 'Padre'],
            ['Luisa', 'Díaz Herrera', 'l.diaz@email.com', 'Madre'],
        ] as $index => [$firstName, $lastName, $email, $relation]) {
            $guardians[$index] = Guardian::forceCreate([
                'organization_id' => $orgId,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $email, // se repite entre organizaciones
                'phone' => '6341112'.str_pad((string) $index, 2, '0', STR_PAD_LEFT),
                'relationship_label' => $relation,
            ]);
        }

        /*
         * ── Grupos tutoriales ────────────────────────────────────────────────
         *
         * Se siembran los CASOS LÍMITE, no solo el feliz, porque son los que la
         * interfaz tiene que saber presentar:
         *
         *   0  con tutor y, más abajo, con delegado    → el caso completo
         *   1  SIN tutor                               → «sin asignar» (US1.3)
         *   2  mismo nombre que el 1, otro turno       → conviven (SC-010)
         *   3  SIN alumnos                             → no debe aparecer (US3.3)
         *
         * Además, varios alumnos se quedan sin grupo a propósito: es el estado
         * real tras la migración y deben verse en su bloque propio (US3.4).
         *
         * Los nombres se repiten entre organizaciones para que las pruebas de
         * aislamiento comprueben algo real.
         */
        $tutorGroups = [];

        foreach ([
            ['4º ESO',       TutorGroup::SHIFT_MORNING,   40, 0],
            ['1º ESO',       TutorGroup::SHIFT_MORNING,   10, null],
            ['1º ESO',       TutorGroup::SHIFT_AFTERNOON, 11, 1],
            ['2º Bachiller', TutorGroup::SHIFT_AFTERNOON, 60, null],
        ] as $index => [$name, $shift, $order, $teacherIndex]) {
            $tutorGroups[$index] = TutorGroup::forceCreate([
                'organization_id' => $orgId,
                'name' => $name,
                'shift' => $shift,
                'academic_year' => '2025-2026',
                'tutor_teacher_id' => $teacherIndex === null
                    ? null
                    : $teachers[$teacherIndex]->getKey(),
                // Orden académico como DATO: el Principio XII prohíbe escribir
                // la escala de un país en el código.
                'sort_order' => $order,
                'status' => 'active',
            ]);
        }

        // ── Alumnos ──────────────────────────────────────────────────────────
        $students = [];

        foreach ([
            [0, 'Lucía', 'Fernández Pérez', '2010-03-15', '4º ESO', 'active', 0],
            [0, 'Alejandro', 'Fernández Pérez', '2012-07-22', '2º ESO', 'active', null],
            [1, 'Sofía', 'López Jiménez', '2009-11-08', '1º Bachiller', 'active', null],
            [2, 'Diego', 'Sánchez Gómez', '2011-01-30', '6º Primaria', 'active', null],
            [3, 'Isabel', 'Moreno Castro', '2010-09-05', '4º ESO', 'active', 0],
            [3, 'Marcos', 'Moreno Castro', '2013-04-18', '4º Primaria', 'active', 1],
            [4, 'Carmen', 'Díaz Herrera', '2008-12-10', '2º Bachiller', 'active', 2],
            [4, 'Javier', 'Díaz Herrera', '2011-06-25', '1º ESO', 'inactive', 1],
        ] as $index => [$guardianIndex, $firstName, $lastName, $birth, $level, $status, $groupIndex]) {
            $students[$index] = Student::forceCreate([
                'organization_id' => $orgId,
                'guardian_id' => $guardians[$guardianIndex]->getKey(),
                'tutor_group_id' => $groupIndex === null
                    ? null
                    : $tutorGroups[$groupIndex]->getKey(),
                'first_name' => $firstName,
                'last_name' => $lastName,
                'date_of_birth' => $birth,
                'school_level' => $level,
                'status' => $status,
            ]);
        }

        // El delegado se designa DESPUÉS de que existan los alumnos: es lo que
        // hace posible la referencia circular entre grupo y alumno.
        $tutorGroups[0]->forceFill([
            'representative_student_id' => $students[0]->getKey(),
        ])->save();

        // ── Inscripciones ────────────────────────────────────────────────────
        $enrollments = [];

        foreach ([
            [0, 0, 80.00, 'active'], [0, 3, 75.00, 'active'],
            [1, 0, 80.00, 'active'],
            [2, 1, 80.00, 'active'], [2, 3, 75.00, 'active'],
            [3, 2, 70.00, 'active'],
            [4, 1, 80.00, 'active'],
            [5, 2, 70.00, 'active'],
            [6, 0, 80.00, 'active'], [6, 3, 75.00, 'active'],
            [7, 0, 80.00, 'inactive'],
        ] as $index => [$studentIndex, $groupIndex, $fee, $status]) {
            $enrollments[$index] = Enrollment::forceCreate([
                'organization_id' => $orgId,
                'student_id' => $students[$studentIndex]->getKey(),
                'class_group_id' => $groups[$groupIndex]->getKey(),
                'enrolled_at' => '2025-09-16',
                'monthly_fee' => $fee,
                'status' => $status,
            ]);
        }

        // ── Sesiones ─────────────────────────────────────────────────────────
        $sessions = [];

        foreach ([
            [0, ['2026-01-13', '2026-01-15', '2026-01-20', '2026-01-22'], 'Álgebra lineal', '17:00:00', '18:30:00'],
            [1, ['2026-01-13', '2026-01-15', '2026-01-20'], 'Funciones y derivadas', '18:30:00', '20:00:00'],
            [2, ['2026-01-10', '2026-01-17', '2026-01-24'], 'Comprensión lectora', '10:00:00', '11:30:00'],
        ] as [$groupIndex, $dates, $topic, $startsAt, $endsAt]) {
            foreach ($dates as $i => $date) {
                $sessions[$groupIndex][] = ClassSession::forceCreate([
                    'organization_id' => $orgId,
                    'class_group_id' => $groups[$groupIndex]->getKey(),
                    'title' => 'Sesión '.($i + 1).' — '.$topic,
                    'session_date' => $date,
                    'starts_at' => $startsAt,
                    'ends_at' => $endsAt,
                    'room' => 'Aula '.($groupIndex + 1),
                ]);
            }
        }

        // ── Asistencias ──────────────────────────────────────────────────────
        $statuses = ['present', 'present', 'present', 'absent', 'present', 'late'];
        $cursor = 0;

        foreach ([0 => [0, 1, 6], 1 => [2, 4], 2 => [3, 5]] as $groupIndex => $studentIndexes) {
            foreach ($sessions[$groupIndex] as $session) {
                foreach ($studentIndexes as $studentIndex) {
                    Attendance::forceCreate([
                        'organization_id' => $orgId,
                        'class_session_id' => $session->getKey(),
                        'student_id' => $students[$studentIndex]->getKey(),
                        'status' => $statuses[$cursor % count($statuses)],
                    ]);
                    $cursor++;
                }
            }
        }

        // ── Pagos ────────────────────────────────────────────────────────────
        foreach ([
            [0, 0, 0, 80.00, 'Octubre 2025', '2025-10-05', 'cash', 'paid'],
            [0, 0, 0, 80.00, 'Noviembre 2025', '2025-11-04', 'card', 'paid'],
            [0, 0, 0, 80.00, 'Diciembre 2025', '2025-12-03', 'cash', 'paid'],
            [0, 0, 0, 80.00, 'Enero 2026', '2026-01-07', 'transfer', 'paid'],
            [0, 0, 1, 75.00, 'Octubre 2025', '2025-10-05', 'cash', 'paid'],
            [0, 0, 1, 75.00, 'Noviembre 2025', '2025-11-04', 'cash', 'paid'],
            [2, 1, 3, 80.00, 'Octubre 2025', '2025-10-06', 'card', 'paid'],
            [2, 1, 3, 80.00, 'Noviembre 2025', '2025-11-05', 'card', 'paid'],
            [2, 1, 3, 80.00, 'Diciembre 2025', '2025-12-04', 'card', 'paid'],
            [2, 1, 3, 80.00, 'Enero 2026', '2026-01-08', 'card', 'pending'],
            [3, 2, 5, 70.00, 'Octubre 2025', '2025-10-07', 'cash', 'paid'],
            [3, 2, 5, 70.00, 'Noviembre 2025', '2025-11-06', 'cash', 'paid'],
            [3, 2, 5, 70.00, 'Diciembre 2025', '2025-12-05', 'cash', 'paid'],
            [3, 2, 5, 70.00, 'Enero 2026', null, 'cash', 'pending'],
            [4, 3, 6, 80.00, 'Octubre 2025', '2025-10-06', 'transfer', 'paid'],
            [4, 3, 6, 80.00, 'Noviembre 2025', '2025-11-05', 'transfer', 'paid'],
            [4, 3, 6, 80.00, 'Diciembre 2025', '2025-12-04', 'transfer', 'paid'],
            [6, 4, 8, 80.00, 'Octubre 2025', '2025-10-05', 'cash', 'paid'],
            [6, 4, 8, 80.00, 'Noviembre 2025', '2025-11-04', 'cash', 'paid'],
            [6, 4, 9, 75.00, 'Noviembre 2025', '2025-11-04', 'cash', 'paid'],
            [6, 4, 8, 80.00, 'Diciembre 2025', '2025-12-03', 'cash', 'cancelled'],
        ] as [$studentIndex, $guardianIndex, $enrollmentIndex, $amount, $period, $paidAt, $method, $status]) {
            Payment::forceCreate([
                'organization_id' => $orgId,
                'student_id' => $students[$studentIndex]->getKey(),
                'guardian_id' => $guardians[$guardianIndex]->getKey(),
                'enrollment_id' => $enrollments[$enrollmentIndex]->getKey(),
                'amount' => $amount,
                'period_label' => $period,
                'paid_at' => $paidAt ?? now()->toDateString(),
                'payment_method' => $method,
                'status' => $status,
            ]);
        }
    }
}
