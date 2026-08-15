<?php

namespace Tests\Feature;

use App\Models\ClassSession;
use App\Models\Organization;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Escenarios 3 y 4 de la historia P5: el profesor registra la asistencia de las
 * sesiones de sus grupos, y solo de esas.
 */
class TeacherAttendanceScopeTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $organization;

    private string $token;

    private ClassSession $mySession;

    private ClassSession $foreignSession;

    private Student $myStudent;

    private Student $foreignStudent;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->organization = $this->createOrganization();

        $teacherUser = $this->createUserFor($this->organization, 'teacher');
        $profile = $this->createTeacherProfile($this->organization, $teacherUser);
        $this->token = $this->tokenFor($teacherUser);

        $otherProfile = $this->createTeacherProfile($this->organization);
        $subject = $this->createSubject($this->organization);

        $mine = $this->createClassGroup($this->organization, [
            'subject_id' => $subject->getKey(),
            'teacher_id' => $profile->getKey(),
        ]);
        $theirs = $this->createClassGroup($this->organization, [
            'subject_id' => $subject->getKey(),
            'teacher_id' => $otherProfile->getKey(),
        ]);

        $this->mySession = $this->createClassSession($this->organization, $mine);
        $this->foreignSession = $this->createClassSession($this->organization, $theirs);

        $this->myStudent = $this->createStudent($this->organization);
        $this->foreignStudent = $this->createStudent($this->organization);

        $this->createEnrollment($this->organization, $this->myStudent, $mine);
        $this->createEnrollment($this->organization, $this->foreignStudent, $theirs);
    }

    // ── Escenario 3: sesión propia ─────────────────────────────────────────

    public function test_teacher_records_attendance_on_its_own_session(): void
    {
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/attendances', [
                'class_session_id' => $this->mySession->getKey(),
                'student_id' => $this->myStudent->getKey(),
                'status' => 'present',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('attendances', [
            'class_session_id' => $this->mySession->getKey(),
            'student_id' => $this->myStudent->getKey(),
            'organization_id' => $this->organization->id,
        ]);
    }

    public function test_teacher_updates_attendance_of_its_own_session(): void
    {
        $attendance = $this->createAttendance($this->organization, $this->mySession, $this->myStudent);

        $this->actingWithToken($this->token)
            ->putJson("/api/v1/attendances/{$attendance->getKey()}", [
                'class_session_id' => $this->mySession->getKey(),
                'student_id' => $this->myStudent->getKey(),
                'status' => 'late',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'late');
    }

    public function test_teacher_can_create_a_session_for_its_own_group(): void
    {
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $this->mySession->class_group_id,
                'title' => 'Sesión nueva',
                'session_date' => '2026-03-02',
            ])
            ->assertCreated();
    }

    // ── Escenario 4: sesión ajena ──────────────────────────────────────────

    public function test_teacher_cannot_record_attendance_on_a_group_it_does_not_teach(): void
    {
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/attendances', [
                'class_session_id' => $this->foreignSession->getKey(),
                'student_id' => $this->foreignStudent->getKey(),
                'status' => 'present',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('attendances', [
            'class_session_id' => $this->foreignSession->getKey(),
        ]);
    }

    public function test_teacher_cannot_update_attendance_of_a_foreign_session(): void
    {
        $attendance = $this->createAttendance($this->organization, $this->foreignSession, $this->foreignStudent);

        $this->actingWithToken($this->token)
            ->putJson("/api/v1/attendances/{$attendance->getKey()}", [
                'class_session_id' => $this->foreignSession->getKey(),
                'student_id' => $this->foreignStudent->getKey(),
                'status' => 'absent',
            ])
            ->assertNotFound(); // el recorte de consulta actúa antes que la policy

        $this->assertSame('present', $attendance->fresh()->status);
    }

    public function test_teacher_cannot_create_a_session_for_a_foreign_group(): void
    {
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $this->foreignSession->class_group_id,
                'title' => 'Sesión intrusa',
                'session_date' => '2026-03-02',
            ])
            ->assertForbidden();
    }

    public function test_teacher_only_lists_attendance_of_its_own_sessions(): void
    {
        $mine = $this->createAttendance($this->organization, $this->mySession, $this->myStudent);
        $this->createAttendance($this->organization, $this->foreignSession, $this->foreignStudent);

        $response = $this->actingWithToken($this->token)
            ->getJson('/api/v1/attendances')
            ->assertOk();

        $this->assertSame([$mine->getKey()], array_column($response->json('data'), 'id'));
    }
}
