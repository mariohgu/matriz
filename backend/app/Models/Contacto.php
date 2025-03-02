<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contacto extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'contactos';
    protected $primaryKey = 'id_contacto';
    
    protected $fillable = [
        'id_municipalidad',
        'nombre_completo',
        'cargo',
        'telefono',
        'email'
    ];

    // Relación con Municipalidad
    public function municipalidad(): BelongsTo
    {
        return $this->belongsTo(Municipalidad::class, 'id_municipalidad', 'id_municipalidad');
    }
}
