<?php

namespace App\Http\Controllers\Api;

use App\Models\Enrollment;
use App\Models\Payment;
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
    protected array $with = ['student', 'guardian', 'enrollment.classGroup'];
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
            'status' => ['required', Rule::in(['paid', 'pending', 'cancelled'])],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
