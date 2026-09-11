<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Etapa educativa: Pre-escolar, Primaria (PEP), ESBA, Bachillerato.
 *
 * Es la UNIDAD DE COBRO del centro. En Guinea Ecuatorial se paga por nivel y no
 * por asignatura: todos los cursos de una etapa cuestan lo mismo —del 1º al 6º
 * de PEP, o 1º Bach CC y 2º Bach Hum— y la cuota es del curso académico, con
 * plazos si el centro los admite.
 *
 * Los nombres NO son constantes del sistema. Las cuatro de Guinea se siembran
 * como punto de partida, pero pertenecen al centro: puede renombrarlas, cambiar
 * los importes o usar otras. Por eso son filas y no un enum.
 */
class Stage extends Model
{
    use BelongsToOrganization, HasFactory;

    /**
     * `organization_id` NO está aquí, como en el resto de entidades de negocio:
     * lo rellena el trait desde el contexto de la petición. Declararlo reabriría
     * la vía para crear una etapa —y su precio— en otro centro.
     */
    protected $fillable = [
        'name',
        'fee',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'fee' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    /** Las aulas de esta etapa. El alumno hereda la etapa de su aula. */
    public function tutorGroups(): HasMany
    {
        return $this->hasMany(TutorGroup::class);
    }
}
