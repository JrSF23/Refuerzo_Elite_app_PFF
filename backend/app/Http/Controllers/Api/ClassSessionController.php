<?php

namespace App\Http\Controllers\Api;

use App\Models\ClassSession;

use App\Rules\BelongsToCurrentOrganization;

use App\Models\ClassGroup;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ClassSessionController extends BaseApiController
{
    protected string $modelClass = ClassSession::class;
    protected array $with = ['classGroup.subject', 'classGroup.teacher', 'taughtByUser'];
    /**
     * Título y aula son columnas propias; el grupo, la relación por la que de
     * verdad se filtra cuando un profesor busca «sus sesiones de Tarde A».
     */
    protected array $searchable = [
        'title',
        'room',
        'classGroup.name',
    ];
    protected string $entityLabel = 'class_session';

    protected function rules(?int $id = null): array
    {
        return [
            'class_group_id' => ['required', new BelongsToCurrentOrganization(ClassGroup::class)],
            'title' => ['required', 'string', 'max:255'],
            'session_date' => ['required', 'date'],
            'starts_at' => ['nullable', 'date_format:H:i'],
            'ends_at' => ['nullable', 'date_format:H:i'],
            'room' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * El profesor solo ve las sesiones de los grupos que imparte.
     */
    protected function applyTeacherScope(Builder $query): void
    {
        $query->whereIn('class_group_id', $this->taughtClassGroupIds());
    }

    /**
     * Marca la sesión como impartida.
     *
     * Endpoint propio y no un campo del formulario, por el mismo motivo que
     * suspender una organización no es un desplegable: es un acto deliberado y
     * DEFINITIVO, y enterrarlo entre los siete campos de la sesión lo convertiría
     * en algo que se cambia sin querer al corregir el aula.
     *
     * El registro se busca por `query()`, que ya lleva el recorte del profesor:
     * una sesión de otro grupo responde 404 y no 403, indistinguible de una que
     * no existe. Es el mismo criterio que `show()` y `update()`.
     */
    public function markTaught(int $id): JsonResponse
    {
        $session = $this->query()->findOrFail($id);

        $this->authorize('markTaught', $session);

        // Ya marcada: 409 y no 422. No es que los datos enviados estén mal —no se
        // envía ninguno—, es que el recurso ya está en ese estado y el marcado no
        // se deshace. Mismo código que usa el borrado de una organización en uso.
        if ($session->isTaught()) {
            return response()->json([
                'message' => __('tenancy.class_sessions.already_taught'),
            ], 409);
        }

        $session->forceFill([
            'taught_at' => now(),
            'taught_by' => auth()->id(),
        ])->save();

        $session->load($this->with);

        $this->recordAudit('marked_taught', $this->entityLabel, $session->getKey(), [
            'taught_at' => $session->taught_at?->toIso8601String(),
        ]);

        return response()->json($session);
    }
}
