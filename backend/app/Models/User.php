<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function createdAuditEvents(): HasMany
    {
        return $this->hasMany(AuditEvent::class, 'user_id');
    }

    /**
     * La organización a la que pertenece la cuenta. Nula solo para los super
     * administradores de plataforma (FR-004).
     *
     * User NO usa el trait de tenancy a propósito: el login tiene que poder
     * encontrar al usuario antes de que exista contexto de organización.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Ficha de profesor vinculada, si la hay. Es el vínculo uno a uno opcional de
     * FR-015a: los grupos que "imparte" un usuario son los de esta ficha.
     */
    public function teacher(): HasOne
    {
        return $this->hasOne(Teacher::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->organization_id === null && $this->hasRole('super_admin');
    }
}
