<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Builder;
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

    /**
     * Grupos con titular que, aun así, nadie puede atender.
     *
     * Desde que la materia de la ficha gobierna el alcance, un grupo cuyo
     * profesor imparte OTRA materia queda tan huérfano como uno sin profesor: su
     * titular no lo alcanza y no puede crearle sesiones. Sin esto el caso es
     * invisible —la ficha se ve perfectamente rellena— y solo aparece cuando el
     * profesor llama diciendo que no ve nada.
     *
     * Vive aquí, y no en el panel ni en el controlador, porque los DOS lo
     * necesitan: el panel para contar cuántos hay y la lista para enseñar
     * cuáles. Con una copia en cada sitio, el día que se afine el criterio el
     * aviso diría 3 y la lista enseñaría 7.
     *
     * Una sola condición cubre los dos casos: con `teachers.subject_id` nulo la
     * comparación de columnas tampoco casa y el grupo entra igual, que es lo
     * correcto porque el efecto para el profesor es idéntico.
     */
    public function scopeSubjectMismatch(Builder $query): Builder
    {
        return $query
            ->whereNotNull('teacher_id')
            ->whereDoesntHave(
                'teacher',
                fn (Builder $teacher) => $teacher->whereColumn('teachers.subject_id', 'class_groups.subject_id')
            );
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
