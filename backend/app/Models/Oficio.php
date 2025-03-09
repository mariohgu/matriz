<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Oficio extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'oficios';
    protected $primaryKey = 'id_oficio';
    
    protected $fillable = [
        'id_municipalidad',
        'numero_oficio',
        'fecha_envio',
        'asunto',
        'contenido',
        'estado',
        'creado_por',
        'actualizado_por'
    ];

    protected $casts = [
        'fecha_envio' => 'date'
    ];

    public function municipalidad()
    {
        return $this->belongsTo(Municipalidad::class, 'id_municipalidad', 'id_municipalidad');
    }

    public function creadoPor()
    {
        return $this->belongsTo(User::class, 'creado_por', 'id');
    }

    public function actualizadoPor()
    {
        return $this->belongsTo(User::class, 'actualizado_por', 'id');
    }
}
