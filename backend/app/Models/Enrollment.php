<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'class_group_id',
        'enrolled_at',
        'monthly_fee',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_at' => 'date',
            'monthly_fee' => 'decimal:2',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function classGroup(): BelongsTo
    {
        return $this->belongsTo(ClassGroup::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
