<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\AuditEvent;

trait RecordsAuditEvents
{
    protected function recordAudit(string $action, string $entityType, ?int $entityId = null, ?array $payload = null): void
    {
        AuditEvent::query()->create([
            'user_id' => auth()->id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'payload' => $payload,
        ]);
    }
}
