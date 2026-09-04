<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Grupo tutorial: el aula a la que pertenece un alumno.
 *
 * NO confundir con `ClassGroup`, que es el grupo de una asignatura. Un alumno
 * pertenece a UN grupo tutorial y a VARIOS grupos de asignatura.
 */
class TutorGroup extends Model
{
    use BelongsToOrganization, HasFactory, SoftDeletes;

    public const SHIFT_MORNING = 'morning';
    public const SHIFT_AFTERNOON = 'afternoon';

    public const SHIFTS = [self::SHIFT_MORNING, self::SHIFT_AFTERNOON];

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';

    public const STATUSES = [self::STATUS_ACTIVE, self::STATUS_INACTIVE];

    /**
     * `organization_id` NO está aquí, deliberadamente: lo rellena el trait desde
     * el contexto de petición. Añadirlo reabriría la vía por la que un cliente
     * podría crear registros en otra organización (FR-006 de la feature 001).
     */
    protected $fillable = [
        'name',
        // La etapa del aula. De ella sale la cuota que paga el alumno, y por eso
        // vive aquí y no en el alumno: así no puede haber un alumno de
        // Bachillerato dentro de un aula de Primaria.
        'stage_id',
        'shift',
        'academic_year',
        'tutor_teacher_id',
        'representative_student_id',
        'sort_order',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    /**
     * Limpieza de referencias al borrar LÓGICAMENTE.
     *
     * `ON DELETE SET NULL` solo actúa en un borrado físico. Con `SoftDeletes` la
     * fila sigue en la tabla —solo gana `deleted_at`—, así que la clave foránea
     * no se dispara y el grupo se quedaría apuntando a un alumno borrado, que ya
     * no aparece en ninguna consulta. La clave foránea da falsa sensación de
     * estar cubierto; hay que hacerlo aquí.
     */
    protected static function booted(): void
    {
        static::deleting(function (TutorGroup $group): void {
            // Al borrar el grupo, sus alumnos se quedan SIN grupo. Nunca se
            // borran ni se desactivan (FR-010).
            //
            // `withTrashed()` por el mismo motivo que en `Student`: un alumno
            // borrado lógicamente que se restaure después no debe volver
            // apuntando a un grupo que ya no existe.
            $group->students()->withTrashed()->update(['tutor_group_id' => null]);
        });
    }

    /**
     * Etapa educativa del aula: Pre-escolar, Primaria, ESBA, Bachillerato.
     *
     * Nula mientras el centro no la haya configurado. Un aula sin etapa es un
     * estado legítimo —existe antes de que nadie fije precios— y lo que provoca
     * es que sus alumnos no tengan cuota, no un error.
     */
    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'tutor_teacher_id');
    }

    public function representative(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'representative_student_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'tutor_group_id');
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}
