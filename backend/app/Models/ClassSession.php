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
     * `taught_at` y `taught_by` NO están aquí, igual que `organization_id`.
     *
     * Los pone el endpoint de marcado, que comprueba quién es el profesor
     * responsable. Si fueran declarables, una edición corriente del formulario
     * podría marcar la sesión como impartida —o devolverla a pendiente, que es
     * justo lo que el centro decidió que no se pueda hacer.
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
     * Quien marcó la sesión como impartida. Nulo si nunca se marcó, y también si
     * la cuenta que la marcó se dio de baja después: la clase se dio igual.
     */
    /**
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
