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
     * `created_by`, `taught_at` y `taught_by` NO están aquí, igual que
     * `organization_id`.
     *
     * Son dos cosas distintas y conviene no confundirlas: `created_by` es quién
     * REGISTRÓ la sesión y `taught_by` quién la marcó como IMPARTIDA. Pueden ser
     * personas distintas, y ninguna de las dos gobierna el acceso — eso lo hace
     * el aula.
     *
     * `created_by` identifica al autor y no puede venir de la petición: si fuera
     * declarable, cualquiera podría atribuir una sesión a otra cuenta enviando el
     * campo a mano. Lo pone el gancho de `booted()` desde la sesión autenticada.
     * Meterlo en este array —o en un `rules()`— convierte la autoría en algo que
     * se declara en vez de algo que se observa.
     *
     * `taught_at` y `taught_by` los pone el endpoint de marcado, que comprueba
     * quién es el profesor responsable. Si fueran declarables, una edición
     * corriente del formulario podría marcar la sesión como impartida —o
     * devolverla a pendiente, que es justo lo que el centro decidió que no se
     * pueda hacer.
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
            'taught_at' => 'datetime',
        ];
    }

    /** ¿Se ha marcado ya como impartida? */
    public function isTaught(): bool
    {
        return $this->taught_at !== null;
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

    /**
     * Quien marcó la sesión como impartida. Nulo si nunca se marcó, y también si
     * la cuenta que la marcó se dio de baja después: la clase se dio igual.
     *
     * Se llama `taughtByUser` y no `taughtBy` a propósito: Eloquent serializa la
     * relación bajo el nombre del método en snake_case, así que `taughtBy` daría
     * la clave `taught_by` —la misma que la columna— y el objeto pisaría el
     * identificador en la respuesta. Con este nombre conviven `taught_by`, que es
     * el número, y `taught_by_user`, que es la cuenta.
     */
    public function taughtByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'taught_by');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}
