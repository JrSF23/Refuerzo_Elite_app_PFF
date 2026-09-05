<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use BelongsToOrganization, HasFactory;

    /**
     * Sin campo monetario, y es deliberado: la asignatura es contenido, no
     * unidad de cobro. El importe vive en `Enrollment::$monthly_fee`, que es lo
     * pactado con un alumno concreto y lo que de verdad se factura.
     */
    protected $fillable = [
        'name',
        'code',
        'level',
        'description',
    ];

    public function classGroups(): HasMany
    {
        return $this->hasMany(ClassGroup::class);
    }
}
