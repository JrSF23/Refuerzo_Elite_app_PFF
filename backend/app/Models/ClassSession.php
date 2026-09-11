<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassSession extends Model
{
    use BelongsToOrganization, HasFactory;

    /**
     * `created_by` NO está aquí, y es deliberado.
     *
     * Es el mismo criterio que `organization_id`: un dato que identifica al autor
     * no puede venir de la petición, porque entonces cualquiera podría atribuir
     * una sesión a otra cuenta enviando el campo a mano. Lo pone el gancho de
     * `booted()` a partir de la sesión autenticada. Meterlo en este array —o en
     * un `rules()`— convierte la autoría en algo que se declara en vez de algo
     * que se observa.
     */
    protected $fillable = [
        'class_group_id',
        'title',
        'session_date',
        'starts_at',
        'ends_at',
        'room',
        'notes',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $session): void {
            // Si ya viene puesto se respeta: seeders, factories y una eventual
            // migración de datos desde `audit_events` fijan el autor a propósito,
            // y son ejecuciones de consola sin sesión de la que deducirlo.
            if ($session->getAttribute('created_by') !== null) {
                return;
            }

            // En consola no hay usuario y queda nulo, que es exactamente lo que
            // significa: nadie la registró desde la aplicación.
            $session->setAttribute('created_by', auth()->id());
        });
    }

    protected function casts(): array
    {
        return [
            'session_date' => 'date',
        ];
    }

    public function classGroup(): BelongsTo
    {
        return $this->belongsTo(ClassGroup::class);
    }

    /**
     * Quién dio de alta la sesión.
     *
     * NO sirve para decidir acceso: eso lo gobierna el aula, vía
     * `class_groups.teacher_id`. Un profesor sigue viendo las sesiones del grupo
     * que imparte aunque las registrara otro, y deja de verlas si le retiran el
     * grupo aunque las registrara él.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}
