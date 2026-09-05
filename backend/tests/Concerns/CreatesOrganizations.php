<?php

namespace Tests\Concerns;

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
use App\Support\OrganizationContext;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * Andamiaje de organizaciones para los tests.
 *
 * Los modelos de negocio no llevan `organization_id` en $fillable —es el trait de
 * tenancy quien lo rellena a partir del contexto, nunca la petición—, así que
 * aquí se usa forceCreate para poder fijarlo explícitamente.
 */
trait CreatesOrganizations
{
    protected function ensureRoles(): void
    {
        foreach (['super_admin', 'org_admin', 'teacher', 'student'] as $role) {
            Role::findOrCreate($role, 'web');
        }
    }

    protected function createOrganization(array $attributes = []): Organization
    {
        return Organization::factory()->create($attributes);
    }

    /**
     * Usuario perteneciente a una organización, con su rol asignado.
     */
    protected function createUserFor(Organization $organization, string $role, array $overrides = []): User
    {
        $user = User::factory()->create(array_merge(['is_active' => true], $overrides));

        $user->forceFill(['organization_id' => $organization->getKey()])->save();
        $user->assignRole($role);

        return $user->refresh();
    }

    /**
     * Super administrador de plataforma: sin organización (FR-004).
     */
    protected function createSuperAdmin(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge(['is_active' => true], $overrides));

        $user->forceFill(['organization_id' => null])->save();
        $user->assignRole('super_admin');

        return $user->refresh();
    }

    /**
     * Ficha de profesor, opcionalmente vinculada a una cuenta (FR-015a).
     */
    protected function createTeacherProfile(Organization $organization, ?User $user = null, array $overrides = []): Teacher
    {
        return Teacher::forceCreate(array_merge([
            'organization_id' => $organization->getKey(),
            'user_id' => $user?->getKey(),
            'first_name' => 'Profesor',
            'last_name' => 'De Prueba',
            'email' => 'prof.'.Str::random(8).'@test.local',
            'phone' => '600000000',
        ], $overrides));
    }

    protected function createGuardian(Organization $organization, array $overrides = []): Guardian
    {
        return Guardian::forceCreate(array_merge([
            'organization_id' => $organization->getKey(),
            'first_name' => 'Tutor',
            'last_name' => 'De Prueba',
            'email' => 'tutor.'.Str::random(8).'@test.local',
            'phone' => '600111222',
            'relationship_label' => 'Padre',
        ], $overrides));
    }

    protected function createStudent(Organization $organization, array $overrides = []): Student
    {
        return Student::factory()->create(array_merge([
            'organization_id' => $organization->getKey(),
        ], $overrides));
    }

    protected function createTutorGroup(Organization $organization, array $overrides = []): TutorGroup
    {
        return TutorGroup::forceCreate(array_merge([
            'organization_id' => $organization->getKey(),
            'name' => '1º ESO '.Str::upper(Str::random(4)),
            'shift' => TutorGroup::SHIFT_MORNING,
            'academic_year' => '2025-2026',
            'sort_order' => 10,
            'status' => TutorGroup::STATUS_ACTIVE,
        ], $overrides));
    }

    protected function createSubject(Organization $organization, array $overrides = []): Subject
    {
        return Subject::forceCreate(array_merge([
            'organization_id' => $organization->getKey(),
            'name' => 'Matemáticas',
            'code' => 'MAT-'.Str::upper(Str::random(6)),
        ], $overrides));
    }

    /**
     * Crea un grupo y, si lleva profesor, le alinea la materia.
     *
     * Un profesor alcanza un grupo cuando lo tiene asignado Y la materia del
     * grupo es la de su ficha (App\Support\TeacherScope). En un centro real es
     * la administración quien mantiene esas dos cosas coherentes al montar el
     * curso; aquí lo hace el fixture, y solo cuando la ficha aún no tiene
     * materia, para no pisar la que un test haya puesto a propósito.
     *
     * Un test que quiera precisamente el caso incoherente —grupo de una materia
     * que el profesor no imparte— le da materia a la ficha ANTES de crear el
     * grupo, y este método la respeta.
     */
    protected function createClassGroup(Organization $organization, array $overrides = []): ClassGroup
    {
        $subjectId = $overrides['subject_id'] ?? $this->createSubject($organization)->getKey();
        unset($overrides['subject_id']);

        $group = ClassGroup::forceCreate(array_merge([
            'organization_id' => $organization->getKey(),
            'subject_id' => $subjectId,
            'name' => 'Grupo de prueba',
            'code' => 'G-'.Str::upper(Str::random(6)),
            'academic_year' => '2025-2026',
            'capacity' => 10,
            'status' => 'active',
        ], $overrides));

        if ($group->teacher_id !== null) {
            Teacher::withoutGlobalScopes()
                ->whereKey($group->teacher_id)
                ->whereNull('subject_id')
                ->update(['subject_id' => $group->subject_id]);
        }

        return $group;
    }

    protected function createEnrollment(Organization $organization, Student $student, ClassGroup $group, array $overrides = []): Enrollment
    {
        return Enrollment::forceCreate(array_merge([
            'organization_id' => $organization->getKey(),
            'student_id' => $student->getKey(),
            'class_group_id' => $group->getKey(),
            'enrolled_at' => '2025-09-16',
            'monthly_fee' => 80,
            'status' => 'active',
        ], $overrides));
    }

    protected function createClassSession(Organization $organization, ClassGroup $group, array $overrides = []): ClassSession
    {
        return ClassSession::forceCreate(array_merge([
            'organization_id' => $organization->getKey(),
            'class_group_id' => $group->getKey(),
            'title' => 'Sesión de prueba',
            'session_date' => '2026-01-13',
        ], $overrides));
    }

    protected function createAttendance(Organization $organization, ClassSession $session, Student $student, array $overrides = []): Attendance
    {
        return Attendance::forceCreate(array_merge([
            'organization_id' => $organization->getKey(),
            'class_session_id' => $session->getKey(),
            'student_id' => $student->getKey(),
            'status' => 'present',
        ], $overrides));
    }

    protected function createPayment(Organization $organization, Student $student, array $overrides = []): Payment
    {
        return Payment::forceCreate(array_merge([
            'organization_id' => $organization->getKey(),
            'student_id' => $student->getKey(),
            'amount' => 80,
            'period_label' => 'Enero 2026',
            'paid_at' => '2026-01-05',
            'payment_method' => 'cash',
            'status' => 'paid',
        ], $overrides));
    }

    /**
     * Juego completo de datos de negocio para una organización, con un registro de
     * cada entidad. Devuelve los modelos indexados por el recurso de la API.
     *
     * @return array<string, \Illuminate\Database\Eloquent\Model>
     */
    protected function seedBusinessData(Organization $organization): array
    {
        $guardian = $this->createGuardian($organization);
        $teacher = $this->createTeacherProfile($organization);
        $subject = $this->createSubject($organization);
        $student = $this->createStudent($organization, ['guardian_id' => $guardian->getKey()]);
        $group = $this->createClassGroup($organization, [
            'subject_id' => $subject->getKey(),
            'teacher_id' => $teacher->getKey(),
        ]);
        $session = $this->createClassSession($organization, $group);
        $enrollment = $this->createEnrollment($organization, $student, $group);
        $attendance = $this->createAttendance($organization, $session, $student);
        $payment = $this->createPayment($organization, $student, [
            'guardian_id' => $guardian->getKey(),
            'enrollment_id' => $enrollment->getKey(),
        ]);

        return [
            'guardians' => $guardian,
            'teachers' => $teacher,
            'subjects' => $subject,
            'students' => $student,
            'class-groups' => $group,
            'class-sessions' => $session,
            'enrollments' => $enrollment,
            'attendances' => $attendance,
            'payments' => $payment,
        ];
    }

    /**
     * Ejecuta un callback con el contexto de organización puesto, como si la
     * petición hubiera pasado por EnsureTenantContext. Sirve para probar el global
     * scope sobre entidades sin endpoint, como los eventos de auditoría.
     */
    protected function withOrganizationContext(Organization $organization, callable $callback): mixed
    {
        $context = app(OrganizationContext::class);
        $context->set($organization);

        try {
            return $callback();
        } finally {
            $context->clear();
        }
    }

    protected function tokenFor(User $user): string
    {
        return $user->createToken('test')->plainTextToken;
    }

    /**
     * Autentica la siguiente petición con este token.
     *
     * `forgetGuards()` NO es opcional cuando un test hace varias peticiones con
     * usuarios distintos: `RequestGuard` cachea el usuario ya resuelto, así que la
     * segunda petición seguiría autenticada como el primero. En producción no
     * ocurre —cada petición reconstruye el contenedor— pero en los tests haría que
     * una comprobación cruzada pasara en verde sin comprobar nada.
     *
     * Se limpia también el contexto de organización por el mismo motivo: es un
     * singleton de petición que en los tests sobrevive de una a otra.
     */
    protected function actingWithToken(string $token): static
    {
        $this->app['auth']->forgetGuards();
        app(OrganizationContext::class)->clear();

        return $this->withToken($token);
    }
}
