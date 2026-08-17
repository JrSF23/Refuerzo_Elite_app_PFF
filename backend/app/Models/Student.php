<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use BelongsToOrganization, HasFactory, SoftDeletes;

    protected $fillable = [
        'guardian_id',
        'tutor_group_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'date_of_birth',
        'school_name',
        'school_level',
        'status',
        'address',
        'notes',
    ];

    protected $appends = ['full_name'];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
        ];
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }

    /**
     * Limpieza al borrar LÓGICAMENTE.
     *
     * `ON DELETE SET NULL` solo actúa en un borrado físico. Con `SoftDeletes` la
     * fila permanece —solo gana `deleted_at`—, así que la clave foránea no se
     * dispara y el grupo del que este alumno era delegado seguiría apuntando a
     * alguien que ya no aparece en ninguna consulta (SC-009).
     *
     * `Teacher` no necesita un gancho equivalente porque no usa borrado lógico:
     * su baja es física y la clave foránea sí actúa.
     */
    protected static function booted(): void
    {
        static::deleting(function (Student $student): void {
            // `withTrashed()` es imprescindible: sin él, `TutorGroup::query()`
            // aplica el filtro de borrado lógico y NO alcanza a los grupos ya
            // borrados. Esos grupos pueden restaurarse, y volverían apuntando a
            // un alumno que ya no existe. Verificado: sin esto, borrar al
            // delegado de un grupo borrado deja el puntero intacto.
            TutorGroup::withTrashed()
                ->where('representative_student_id', $student->getKey())
                ->update(['representative_student_id' => null]);
        });
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(Guardian::class);
    }

    public function tutorGroup(): BelongsTo
    {
        return $this->belongsTo(TutorGroup::class, 'tutor_group_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
