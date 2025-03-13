<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstadoSeguimiento extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'estados_seguimiento';
    protected $primaryKey = 'id_estado';
    
    protected $fillable = [
        'id_evento',
        'id_contacto',
        'id_tipo_reunion',
        'fecha',
        'id_estado_ref',
        'descripcion',
        'compromiso',
        'fecha_compromiso',
        'creado_por',
        'actualizado_por'
    ];

    protected $casts = [
        'fecha' => 'date',
        'fecha_compromiso' => 'date'
    ];

    // Relación con Evento
    public function evento(): BelongsTo
    {
        return $this->belongsTo(Evento::class, 'id_evento', 'id_evento');
    }

    // Relación con Contacto
    public function contacto(): BelongsTo
    {
        return $this->belongsTo(Contacto::class, 'id_contacto', 'id_contacto');
    }

    // Relación con TipoReunion
    public function tipoReunion(): BelongsTo
    {
        return $this->belongsTo(TipoReunion::class, 'id_tipo_reunion', 'id_tipo_reunion');
    }

    // Relación con Estado
    public function estado(): BelongsTo
    {
        return $this->belongsTo(Estado::class, 'id_estado_ref', 'id_estado');
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
