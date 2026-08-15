<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Verificación operativa del backfill: recuento por entidad y por organización, y
 * detección de filas huérfanas.
 *
 * Se ejecuta antes y después de migrar en producción para comparar los totales
 * (SC-004). Devuelve código de salida distinto de cero si encuentra cualquier fila
 * sin organización, de modo que sirva como puerta en un script de despliegue.
 */
class VerifyTenancyBackfill extends Command
{
    protected $signature = 'tenancy:verify';

    protected $description = 'Comprueba que ninguna fila de negocio quedó sin organización y muestra los recuentos por organización';

    /** @var list<string> */
    private const BUSINESS_TABLES = [
        'guardians', 'teachers', 'subjects', 'students', 'class_groups',
        'class_sessions', 'enrollments', 'attendances', 'payments', 'audit_events',
    ];

    public function handle(): int
    {
        if (! Schema::hasTable('organizations')) {
            $this->error('La tabla organizations no existe: la migración M1 no se ha aplicado.');

            return self::FAILURE;
        }

        $organizations = DB::table('organizations')->orderBy('id')->get(['id', 'name', 'slug', 'status', 'deleted_at']);

        $this->info('Organizaciones');
        $this->table(
            ['id', 'nombre', 'slug', 'estado', 'borrada'],
            $organizations->map(fn ($organization): array => [
                $organization->id,
                $organization->name,
                $organization->slug,
                $organization->status,
                $organization->deleted_at === null ? '—' : $organization->deleted_at,
            ])->all()
        );

        $rows = [];
        $orphans = [];
        $total = 0;

        foreach (self::BUSINESS_TABLES as $table) {
            $byOrganization = DB::table($table)
                ->selectRaw('organization_id, COUNT(*) as total')
                ->groupBy('organization_id')
                ->pluck('total', 'organization_id');

            $orphanCount = (int) ($byOrganization[null] ?? 0);
            $tableTotal = (int) $byOrganization->sum();
            $total += $tableTotal;

            if ($orphanCount > 0) {
                $orphans[$table] = $orphanCount;
            }

            $perOrganization = $organizations
                ->map(fn ($organization): string => $organization->id.': '.(int) ($byOrganization[$organization->id] ?? 0))
                ->implode('  ');

            $rows[] = [$table, $tableTotal, $perOrganization, $orphanCount > 0 ? $orphanCount : '—'];
        }

        // `users` se lista aparte: su organización es nula a propósito para los
        // super administradores de plataforma (FR-004), así que no son huérfanas.
        $platformUsers = DB::table('users')->whereNull('organization_id')->count();

        $this->newLine();
        $this->info('Entidades de negocio');
        $this->table(['tabla', 'total', 'por organización', 'huérfanas'], $rows);

        $this->newLine();
        $this->line("  Filas de negocio: {$total}");
        $this->line("  Usuarios sin organización (super administradores): {$platformUsers}");

        if ($orphans !== []) {
            $this->newLine();
            $this->error('Hay filas de negocio sin organización:');

            foreach ($orphans as $table => $count) {
                $this->line("  - {$table}: {$count}");
            }

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Sin filas huérfanas: el backfill está completo.');

        return self::SUCCESS;
    }
}
