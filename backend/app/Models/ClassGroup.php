<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassGroup extends Model
{
    use BelongsToOrganization, HasFactory;

    protected $fillable = [
        // El aula a la que pertenece. Un grupo de asignatura es el AULA × la
        // MATERIA: «1º ESBA» da Matemáticas con Luis y Lengua con Marta.
        'tutor_group_id',
        'subject_id',
        'teacher_id',
        'name',
        'code',
        'academic_year',
        'schedule',
        'capacity',
        'start_date',
        'end_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    /**
     * El aula. Nulo en los grupos creados antes de que existiera el vínculo: no
     * se les inventa una, porque sus alumnos venían de aulas distintas.
     */
    public function tutorGroup(): BelongsTo
    {
        return $this->belongsTo(TutorGroup::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function classSessions(): HasMany
    {
        return $this->hasMany(ClassSession::class);
    }
}
