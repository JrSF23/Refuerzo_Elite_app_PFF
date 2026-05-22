<?php

namespace App\Http\Controllers\Api;

use App\Models\Enrollment;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PaymentController extends BaseApiController
{
    protected string $modelClass = Payment::class;
    protected array $with = ['student', 'guardian', 'enrollment.classGroup'];
    protected string $entityLabel = 'payment';

    protected function rules(?int $id = null): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'guardian_id' => ['nullable', 'exists:guardians,id'],
            'enrollment_id' => [
                'nullable',
                'exists:enrollments,id',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null) {
                        return;
                    }

                    $studentId = request()->integer('student_id');
                    if ($studentId && ! Enrollment::where('id', $value)->where('student_id', $studentId)->exists()) {
                        $fail("L'inscription sélectionnée n'appartient pas à cet élève.");
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
