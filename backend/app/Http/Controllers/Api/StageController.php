<?php

namespace App\Http\Controllers\Api;

use App\Models\Stage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\Rule;

/**
 * Etapas educativas y su cuota.
 *
 * Solo la administración del centro entra aquí: la cuota es un campo monetario,
 * y el invariante de la feature de tenancy dice que el profesor no ve ninguno
 * (FR-016). La ruta lo impone además con `role.any:org_admin`.
 */
class StageController extends BaseApiController
{
    protected string $modelClass = Stage::class;

    protected array $searchable = ['name'];

    protected string $entityLabel = 'stage';

    /**
     * Cuántas aulas hay en cada etapa.
     *
     * No es adorno: antes de cambiar una cuota, el administrador necesita saber
     * a cuánta gente afecta, y antes de borrar una etapa, si hay aulas colgando.
     */
    protected function query(): Builder
    {
        return parent::query()
            ->withCount('tutorGroups')
            // Orden pedagógico y no alfabético: «Bachillerato» iría antes que
            // «ESBA» solo por la letra, y Pre-escolar acabaría el último.
            ->orderBy('sort_order')
            ->orderBy('name');
    }

    protected function rules(?int $id = null): array
    {
        return [
            /*
             * Único POR ORGANIZACIÓN y comprobado aquí, no por el índice de la
             * base: dejarlo al índice haría que el error de clave duplicada
             * delatara la existencia de una etapa de otro centro (FR-020).
             */
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('stages', 'name')
                    ->ignore($id)
                    ->where('organization_id', $this->currentOrganizationId()),
            ],

            /*
             * Sin tope superior y sin valor por defecto sugerido. Las cuotas de
             * Guinea Ecuatorial se cuentan en cientos de miles de francos, y
             * cada centro fija las suyas: cualquier cifra que pusiéramos aquí
             * pasaría por recomendación del sistema.
             */
            'fee' => ['required', 'numeric', 'min:0'],

            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
