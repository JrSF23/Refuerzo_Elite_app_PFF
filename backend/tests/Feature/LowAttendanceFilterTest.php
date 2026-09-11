<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Student;
use App\Support\AdminDashboard;
use App\Support\LowAttendance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * El destino del aviso «alumnos con baja asistencia».
 *
 * El panel dice cuántos hay; esta lista tiene que enseñar EXACTAMENTE a esos.
 * Lo que se fija aquí no es solo que el filtro acote, sino que el criterio sea
 * uno solo: si el recuento y la lista se calcularan por separado, ambas
 * pantallas serían defendibles y estarían diciendo cosas distintas.
 */
class LowAttendanceFilterTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $organization;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();
        $this->organization = $this->createOrganization();
    }

    private function actingAsAdmin(): static
    {
        return $this->withToken($this->tokenFor($this->createUserFor($this->organization, 'org_admin')));
    }

    /**
     * Registra `$sessions` sesiones dentro de la ventana, de las cuales
     * `$absences` son faltas.
     */
    private function studentWithAttendance(int $sessions, int $absences): Student
    {
        $student = $this->createStudent($this->organization);
        $group = $this->createClassGroup($this->organization);

        foreach (range(1, $sessions) as $index) {
            $session = $this->createClassSession($this->organization, $group, [
                'session_date' => Carbon::now()->subDays($index)->toDateString(),
            ]);

            $this->createAttendance($this->organization, $session, $student, [
                'status' => $index <= $absences ? 'absent' : 'present',
            ]);
        }

        return $student;
    }

    public function test_the_filter_returns_only_the_students_below_the_threshold(): void
    {
        $low = $this->studentWithAttendance(sessions: 8, absences: 4);   // 50 %
        $this->studentWithAttendance(sessions: 8, absences: 0);          // 100 %

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/students?attendance=low')
            ->assertOk();

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $low->id);
    }

    /**
     * El mínimo de registros no es cosmético.
     *
     * Dos faltas de dos sesiones dan 0 % y ese alumno encabezaría la lista
     * aunque acabe de matricularse. No es un problema de asistencia, es falta de
     * datos, y colarlo vacía el aviso de sentido.
     */
    public function test_a_student_with_too_few_records_does_not_enter_however_bad_the_rate(): void
    {
        $this->studentWithAttendance(sessions: 2, absences: 2); // 0 %, pero solo 2 registros

        $this->actingAsAdmin()
            ->getJson('/api/v1/students?attendance=low')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_attendance_outside_the_window_is_not_counted(): void
    {
        $student = $this->createStudent($this->organization);
        $group = $this->createClassGroup($this->organization);

        // Todas fuera de la ventana: por muy malas que sean, no cuentan.
        foreach (range(1, 8) as $index) {
            $session = $this->createClassSession($this->organization, $group, [
                'session_date' => Carbon::now()
                    ->subDays(LowAttendance::WINDOW_DAYS + $index + 1)
                    ->toDateString(),
            ]);

            $this->createAttendance($this->organization, $session, $student, ['status' => 'absent']);
        }

        $this->actingAsAdmin()
            ->getJson('/api/v1/students?attendance=low')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    /**
     * La fracción que la pantalla necesita para no engañar.
     *
     * Sin el denominador, «50 %» sobre 4 registros parece más grave que «72,7 %»
     * sobre 22, y es al revés: la segunda es la accionable.
     */
    public function test_the_list_carries_the_records_and_absences_of_the_window(): void
    {
        $this->studentWithAttendance(sessions: 8, absences: 4);

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/students?attendance=low')
            ->assertOk();

        $response->assertJsonPath('data.0.attendance_records', 8);
        $response->assertJsonPath('data.0.attendance_absences', 4);
    }

    public function test_the_worst_by_absolute_absences_comes_first(): void
    {
        $this->studentWithAttendance(sessions: 4, absences: 2);    // 50 %, 2 faltas
        $sustained = $this->studentWithAttendance(sessions: 20, absences: 9); // 55 %, 9 faltas

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/students?attendance=low')
            ->assertOk();

        $response->assertJsonPath('data.0.id', $sustained->id);
    }

    /**
     * La invariante que justifica que el criterio viva en un solo sitio.
     */
    public function test_the_panel_count_and_the_list_always_agree(): void
    {
        $this->studentWithAttendance(sessions: 8, absences: 4);
        $this->studentWithAttendance(sessions: 12, absences: 7);
        $this->studentWithAttendance(sessions: 8, absences: 0);
        $this->studentWithAttendance(sessions: 2, absences: 2);

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/students?attendance=low')
            ->assertOk();

        $items = collect(app(AdminDashboard::class)->payload()['attentionItems'] ?? []);
        $alert = $items->firstWhere('key', 'lowAttendance');

        $this->assertNotNull($alert, 'El aviso debería existir con dos alumnos por debajo del umbral.');
        $this->assertSame($alert['count'], $response->json('meta.total') ?? $response->json('total'));
    }

    public function test_without_the_parameter_the_list_is_not_narrowed(): void
    {
        $this->studentWithAttendance(sessions: 8, absences: 4);
        $this->studentWithAttendance(sessions: 8, absences: 0);

        $this->actingAsAdmin()
            ->getJson('/api/v1/students')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }
}
