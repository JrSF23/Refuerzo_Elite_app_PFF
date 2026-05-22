<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Enrollment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'class_group_id',
        'enrolled_at',
        'monthly_fee',
        'status',
        'notes',
    ];

    protected $appends = ['display_label'];

    protected function casts(): array
    {
        return [
            'enrolled_at' => 'date',
            'monthly_fee' => 'decimal:2',
        ];
    }

    public function getDisplayLabelAttribute(): string
    {
        $studentName = $this->student?->full_name ?? "Alumno #{$this->student_id}";
        $groupName = $this->classGroup?->name ?? "Grupo #{$this->class_group_id}";

        return "{$studentName} — {$groupName}";
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
