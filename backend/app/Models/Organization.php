<?php

namespace App\Models;

use Database\Factories\OrganizationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Unidad de aislamiento del sistema.
 *
 * No usa el trait de tenancy: es la tabla raíz, y su acceso lo restringe el rol
 * super_admin, no un global scope de organización.
 */
class Organization extends Model
{
    /** @use HasFactory<OrganizationFactory> */
    use HasFactory, SoftDeletes;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_SUSPENDED = 'suspended';

    /**
     * `status` queda deliberadamente fuera: toda organización nace activa y el
     * cambio de estado tiene endpoints propios, para que suspender sea un acto
     * explícito y auditable en lugar de un efecto colateral de un update.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'contact_email',
        'contact_phone',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'deleted_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @param  Builder<Organization>  $query
     * @return Builder<Organization>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}
