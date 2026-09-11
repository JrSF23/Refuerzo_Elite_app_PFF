<?php

namespace Tests\Feature;

use App\Models\ClassGroup;
use App\Models\ClassSession;
use App\Models\Organization;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Autoría de la sesión: `class_sessions.created_by`.
 *
 * Responde «quién la registró», que es una pregunta DISTINTA de «quién puede
 * verla». El acceso lo sigue gobernando el aula. Estas pruebas fijan las dos
 * cosas a la vez, porque es justo donde se pueden confundir.
 */
class ClassSessionAuthorshipTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $organization;

    private User $teacherUser;

    private Teacher $profile;

    private string $token;

    private ClassGroup $group;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->organization = $this->createOrganization();

        $this->teacherUser = $this->createUserFor($this->organization, 'teacher');
        $this->profile = $this->createTeacherProfile($this->organization, $this->teacherUser);
        $this->token = $this->tokenFor($this->teacherUser);

        $this->group = $this->createClassGroup($this->organization, [
            'subject_id' => $this->createSubject($this->organization)->getKey(),
            'teacher_id' => $this->profile->getKey(),
        ]);
    }

    public function test_the_session_records_the_account_that_created_it(): void
    {
        $response = $this->actingWithToken($this->token)
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $this->group->getKey(),
                'title' => 'Repaso de ecuaciones',
                'session_date' => '2026-03-02',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('class_sessions', [
            'id' => $response->json('id'),
            'created_by' => $this->teacherUser->getKey(),
        ]);
    }

    /**
     * El campo no está en `$fillable`, así que enviarlo no debe surtir efecto.
     *
     * Es la prueba que impide que la autoría se convierta en algo declarable: sin
     * ella, bastaría con añadir `created_by` al array del modelo para que
     * cualquiera pudiera atribuir una sesión a otra cuenta.
     */
    public function test_the_author_cannot_be_forged_from_the_payload(): void
    {
        $someoneElse = $this->createUserFor($this->organization, 'org_admin');

        $response = $this->actingWithToken($this->token)
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $this->group->getKey(),
                'title' => 'Sesión atribuida a otro',
                'session_date' => '2026-03-03',
                'created_by' => $someoneElse->getKey(),
            ])
            ->assertCreated();

        $this->assertDatabaseHas('class_sessions', [
            'id' => $response->json('id'),
            'created_by' => $this->teacherUser->getKey(),
        ]);
    }

    /**
     * Dar de baja la cuenta NO puede llevarse por delante el registro académico.
     *
     * La clave es SET NULL a propósito: con CASCADE, borrar al profesor borraría
     * sus sesiones y, en cadena, la asistencia de sus alumnos.
     */
    public function test_deleting_the_author_keeps_the_session(): void
    {
        $session = $this->createClassSession($this->organization, $this->group, [
            'created_by' => $this->teacherUser->getKey(),
        ]);

        $this->teacherUser->delete();

        $this->assertDatabaseHas('class_sessions', [
            'id' => $session->getKey(),
            'created_by' => null,
        ]);
    }

    /**
     * La autoría NO gobierna el acceso: eso lo sigue decidiendo el aula.
     *
     * Un profesor ve las sesiones del grupo que imparte aunque las registrara
     * otra persona. Si esta prueba se pusiera en rojo por un cambio en el scope,
     * significaría que alguien ató la visibilidad al autor, que es exactamente lo
     * que no se quiere.
     */
    public function test_authorship_does_not_govern_visibility(): void
    {
        $otherUser = $this->createUserFor($this->organization, 'org_admin');

        $session = $this->createClassSession($this->organization, $this->group, [
            'created_by' => $otherUser->getKey(),
        ]);

        $ids = $this->actingWithToken($this->token)
            ->getJson('/api/v1/class-sessions')
            ->assertOk()
            ->json('data.*.id');

        $this->assertContains($session->getKey(), $ids);
    }

    /**
     * En consola no hay sesión de la que deducir el autor, y queda nulo. Es lo
     * que significa: no lo registró nadie desde la aplicación.
     */
    public function test_console_created_sessions_have_no_author(): void
    {
        $session = $this->withOrganizationContext(
            $this->organization,
            fn () => ClassSession::query()->create([
                'class_group_id' => $this->group->getKey(),
                'title' => 'Alta desde consola',
                'session_date' => '2026-03-04',
            ])
        );

        $this->assertNull($session->created_by);
    }
}
