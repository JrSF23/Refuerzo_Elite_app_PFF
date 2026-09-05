<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Stage;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Estado de cobros: la cuota de la etapa, menos lo cobrado.
 *
 * Es lo que conecta las dos mitades que ya existían por separado — la etapa
 * sabía cuánto cuesta el curso, los pagos cuánto se había ingresado, y nadie
 * restaba una cosa de la otra.
 *
 * Lo que se defiende aquí es sobre todo que NO SE INVENTE una deuda. Un número
 * en esta pantalla se convierte en una llamada a una familia, así que un cero de
 * más o de menos no es un detalle de presentación.
 */
class BillingTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $orgA;

    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->orgA = $this->createOrganization(['name' => 'Centro A']);
        $this->adminToken = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));
    }

    private function createStage(Organization $organization, float $fee, string $name = 'ESBA'): Stage
    {
        return Stage::forceCreate([
            'organization_id' => $organization->getKey(),
            'name' => $name,
            'fee' => $fee,
            'sort_order' => 0,
        ]);
    }

    /** Alumno dentro de un aula de la etapa indicada. */
    private function studentInStage(Organization $organization, ?Stage $stage, string $lastName = 'Ondo'): Student
    {
        $aula = $this->createTutorGroup($organization, [
            'name' => 'Aula '.$lastName,
            'stage_id' => $stage?->getKey(),
        ]);

        return $this->createStudent($organization, [
            'last_name' => $lastName,
            'tutor_group_id' => $aula->getKey(),
        ]);
    }

    /**
     * Compara importes sin atarse al tipo que sobrevive al JSON.
     *
     * `110000.0` es un float en PHP pero se serializa como `110000` y vuelve
     * como entero, así que `assertSame` fallaría por el tipo aunque la cifra sea
     * exacta. Lo que se comprueba aquí es la aritmética del cobro, no si el
     * codificador conservó el punto decimal.
     */
    private function assertAmount(float $expected, mixed $actual, string $message = ''): void
    {
        $this->assertIsNumeric($actual, $message);
        $this->assertSame($expected, (float) $actual, $message);
    }

    private function billing(array $params = []): array
    {
        return $this->actingWithToken($this->adminToken)
            ->getJson('/api/v1/billing'.($params ? '?'.http_build_query($params) : ''))
            ->assertOk()
            ->json();
    }

    public function test_the_fee_comes_from_the_stage_of_the_classroom(): void
    {
        $stage = $this->createStage($this->orgA, 110000);
        $student = $this->studentInStage($this->orgA, $stage);

        $fila = collect($this->billing()['data'])->firstWhere('id', $student->getKey());

        $this->assertSame('ESBA', $fila['stage']);
        $this->assertAmount(110000.0, $fila['fee']);
        $this->assertAmount(0.0, $fila['paid']);
        $this->assertAmount(110000.0, $fila['outstanding']);
    }

    public function test_paid_instalments_reduce_what_is_owed(): void
    {
        $stage = $this->createStage($this->orgA, 90000);
        $student = $this->studentInStage($this->orgA, $stage);

        $this->createPayment($this->orgA, $student, ['amount' => 30000, 'status' => 'paid']);
        $this->createPayment($this->orgA, $student, ['amount' => 20000, 'status' => 'paid']);

        $fila = collect($this->billing()['data'])->firstWhere('id', $student->getKey());

        $this->assertAmount(50000.0, $fila['paid']);
        $this->assertAmount(40000.0, $fila['outstanding']);
    }

    /**
     * Solo lo COBRADO cuenta. Un pago pendiente o anulado no reduce la deuda:
     * meterlo en la suma haría desaparecer de la lista justo a quien hay que
     * reclamar.
     */
    public function test_pending_and_cancelled_payments_do_not_reduce_the_debt(): void
    {
        $stage = $this->createStage($this->orgA, 100000);
        $student = $this->studentInStage($this->orgA, $stage);

        $this->createPayment($this->orgA, $student, ['amount' => 40000, 'status' => 'pending']);
        $this->createPayment($this->orgA, $student, ['amount' => 30000, 'status' => 'cancelled']);
        $this->createPayment($this->orgA, $student, ['amount' => 10000, 'status' => 'paid']);

        $fila = collect($this->billing()['data'])->firstWhere('id', $student->getKey());

        $this->assertAmount(10000.0, $fila['paid']);
        $this->assertAmount(90000.0, $fila['outstanding']);
    }

    /**
     * EL punto que más importa: sin cuota fijada, la deuda es NULA y no cero ni
     * el importe completo. El centro aún no ha dicho cuánto cuesta lo suyo, y
     * cualquiera de las dos cifras convertiría un dato que falta en una
     * afirmación sobre una familia.
     */
    public function test_a_student_without_a_stage_has_no_debt_rather_than_zero(): void
    {
        $sinEtapa = $this->studentInStage($this->orgA, null, 'SinEtapa');
        $sinAula = $this->createStudent($this->orgA, ['last_name' => 'SinAula']);

        $filas = collect($this->billing()['data'])->keyBy('id');

        foreach ([$sinEtapa, $sinAula] as $alumno) {
            $fila = $filas[$alumno->getKey()];

            $this->assertNull($fila['fee'], 'Se inventó una cuota.');
            $this->assertNull($fila['outstanding'], 'Se inventó una deuda.');
        }
    }

    /** Quien ya pagó de más o justo queda saldado, sin deuda negativa que reclamar. */
    public function test_paying_the_whole_course_settles_the_account(): void
    {
        $stage = $this->createStage($this->orgA, 50000);
        $student = $this->studentInStage($this->orgA, $stage);

        $this->createPayment($this->orgA, $student, ['amount' => 50000, 'status' => 'paid']);

        $fila = collect($this->billing()['data'])->firstWhere('id', $student->getKey());

        $this->assertAmount(0.0, $fila['outstanding']);
    }

    /** El profesor no accede a ninguna información económica (FR-016). */
    public function test_a_teacher_never_reaches_the_billing_state(): void
    {
        $teacherUser = $this->createUserFor($this->orgA, 'teacher');
        $this->createTeacherProfile($this->orgA, $teacherUser);

        $this->actingWithToken($this->tokenFor($teacherUser))
            ->getJson('/api/v1/billing')
            ->assertForbidden();
    }

    /**
     * Ni los alumnos ni los pagos de otro centro entran en la cuenta. Aquí es
     * especialmente fácil perderlo sin enterarse: nadie ve una fila ajena, solo
     * una deuda algo distinta de la que debería.
     */
    public function test_the_account_never_mixes_another_organization(): void
    {
        $orgB = $this->createOrganization(['name' => 'Centro B']);

        $stageA = $this->createStage($this->orgA, 100000);
        $mio = $this->studentInStage($this->orgA, $stageA, 'Propio');
        $this->createPayment($this->orgA, $mio, ['amount' => 25000, 'status' => 'paid']);

        $stageB = $this->createStage($orgB, 999999, 'ESBA B');
        $ajeno = $this->studentInStage($orgB, $stageB, 'Ajeno');
        $this->createPayment($orgB, $ajeno, ['amount' => 999999, 'status' => 'paid']);

        $data = $this->billing()['data'];

        $this->assertCount(1, $data, 'Se coló un alumno del otro centro.');
        $this->assertSame($mio->getKey(), $data[0]['id']);
        $this->assertAmount(25000.0, $data[0]['paid'], 'Se sumó un pago del otro centro.');
        $this->assertAmount(75000.0, $data[0]['outstanding']);
    }

    public function test_only_debtors_can_be_requested(): void
    {
        $stage = $this->createStage($this->orgA, 60000);

        $debe = $this->studentInStage($this->orgA, $stage, 'Debe');
        $alDia = $this->studentInStage($this->orgA, $stage, 'AlDia');
        $this->createPayment($this->orgA, $alDia, ['amount' => 60000, 'status' => 'paid']);

        $ids = collect($this->billing(['pending' => 1])['data'])->pluck('id');

        $this->assertContains($debe->getKey(), $ids);
        $this->assertNotContains($alDia->getKey(), $ids);
    }

    public function test_students_can_be_searched_by_name(): void
    {
        $stage = $this->createStage($this->orgA, 60000);
        $this->studentInStage($this->orgA, $stage, 'Nchama');
        $this->studentInStage($this->orgA, $stage, 'Obiang');

        $data = $this->billing(['search' => 'Nchama'])['data'];

        $this->assertCount(1, $data);
        $this->assertStringContainsString('Nchama', $data[0]['full_name']);
    }
}
