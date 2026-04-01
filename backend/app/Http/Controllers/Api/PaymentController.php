<?php

namespace App\Http\Controllers\Api;

use App\Models\Payment;

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
            'enrollment_id' => ['nullable', 'exists:enrollments,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'period_label' => ['required', 'string', 'max:50'],
            'paid_at' => ['required', 'date'],
            'payment_method' => ['required', 'string', 'max:50'],
            'status' => ['required', 'string', 'max:50'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
