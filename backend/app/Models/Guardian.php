<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Guardian extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'relationship_label',
        'address',
        'notes',
    ];

    protected $appends = ['full_name'];

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
