<?php

namespace App\Http\Controllers\Api;

use App\Models\Enrollment;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Rules\BelongsToCurrentOrganization;
use App\Models\Student;
use App\Models\Guardian;
use Illuminate\Validation\Rule;

class PaymentController extends BaseApiController
{
    protected string $modelClass = Payment::class;
    /**
     * La etapa del alumno viaja con el pago: es de donde sale la cuota contra la
     * que se contrasta el importe. `enrollment` se conserva porque los pagos
     * antiguos la tienen, pero ya no se pide al cobrar — la cuota es del curso,
     * no de cada asignatura.
     */
    protected array $with = ['student.tutorGroup.stage', 'guardian', 'enrollment.classGroup'];
    /**
     * El alumno primero, que es por donde se busca un pago. `reference` y
     * `period_label` son columnas propias y sí sirven: el justificante y el
     * periodo son justo lo que se teclea cuando se busca un recibo concreto.
     *
     * `amount` NO se incluye: es un número, `like` sobre él daría coincidencias
     * absurdas —«10» encontraría 100, 110 y 1000— y el importe no es como se
     * localiza un pago.
     */
    protected array $searchable = [
        'student.first_name',
        'student.last_name',
        'period_label',
        'reference',
    ];
    protected string $entityLabel = 'payment';

    /** Estados que admite un pago. Una sola lista: la validación y el filtro. */
    private const STATUSES = ['paid', 'pending', 'cancelled'];

    /**
     * Filtro por estado.
     *
     * Existe para que el aviso de «pagos pendientes» del panel lleve A LOS
     * PENDIENTES y no al listado entero. Un aviso que obliga a buscar a mano lo
     * que acaba de contarte deja de usarse, que es justo lo que estaba pasando.
     *
     * ── Por qué aquí y no en `query()` ──────────────────────────────────────
     *
     * Es el mismo patrón que ya mordió en `StudentController`,
     * `ClassSessionController` y `AttendanceController`: `query()` lo usan
     * TAMBIÉN `show`, `update` y `destroy`, y `status` es un campo EDITABLE del
     * pago, así que viaja en el cuerpo de cada edición. Puesto en `query()`,
     * marcar como pagado un pendiente lo buscaría entre los pagados —donde
     * todavía no está— y `PUT /payments/{id}` devolvería 404.
     */
    protected function applyIndexFilters(Builder $query): void
    {
        if (! request()->filled('status')) {
            return;
        }

        $status = request()->string('status')->toString();

        if (! in_array($status, self::STATUSES, true)) {
            // Un estado inexistente NO puede devolver el listado entero: quien
            // pidió acotar creería estar viendo todos los pendientes.
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where('status', $status);
    }

    protected function rules(?int $id = null): array
    {
        return [
            'student_id' => ['required', new BelongsToCurrentOrganization(Student::class)],
            'guardian_id' => ['nullable', new BelongsToCurrentOrganization(Guardian::class)],
            'enrollment_id' => [
                'nullable',
                new BelongsToCurrentOrganization(Enrollment::class),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null) {
                        return;
                    }

                    $studentId = request()->integer('student_id');
                    if ($studentId && ! Enrollment::where('id', $value)->where('student_id', $studentId)->exists()) {
                        $fail(__('tenancy.payments.enrollment_mismatch'));
                    }
                },
            ],
            'amount' => ['required', 'numeric', 'min:0'],
            'period_label' => ['required', 'string', 'max:50'],
            'paid_at' => ['required', 'date'],
            'payment_method' => ['required', Rule::in(['cash', 'card', 'transfer'])],
            'status' => ['required', Rule::in(self::STATUSES)],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
