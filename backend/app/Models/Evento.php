<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evento extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'eventos';
    protected $primaryKey = 'id_evento';
    
    protected $fillable = [
        'id_municipalidad',
        'id_contacto',
        'tipo_acercamiento',
        'lugar',
        'fecha',
        'modalidad',
        'descripcion',
        'creado_por',
        'actualizado_por'
    ];

    protected $casts = [
        'fecha' => 'date'
    ];

    // Relación con Municipalidad
    public function municipalidad(): BelongsTo
    {
        return $this->belongsTo(Municipalidad::class, 'id_municipalidad', 'id_municipalidad');
    }

    // Relación con Contacto
    public function contacto(): BelongsTo
    {
        return $this->belongsTo(Contacto::class, 'id_contacto', 'id_contacto');
    }

    // Relación con Usuario que creó
    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por', 'id');
    }

    // Relación con Usuario que actualizó
    public function actualizadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actualizado_por', 'id');
    }
}
