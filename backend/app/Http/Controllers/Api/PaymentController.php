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
                        $fail('La matrícula seleccionada no pertenece a este alumno.');
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
