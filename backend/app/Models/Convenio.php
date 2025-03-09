<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Convenio extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'convenios';
    protected $primaryKey = 'id_convenio';
    
    protected $fillable = [
        'id_municipalidad',
        'tipo_convenio',
        'monto',
        'fecha_firma',
        'estado',
        'descripcion',
        'creado_por',
        'actualizado_por'
    ];

    protected $casts = [
        'fecha_firma' => 'date',
        'monto' => 'decimal:2'
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
