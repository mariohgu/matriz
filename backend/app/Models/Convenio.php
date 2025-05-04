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
    public $timestamps = true;

    protected $fillable = [
        'id_municipalidad',
        'tipo_convenio',
        'monto',
        'fecha_firma',
        'id_estado_convenio',
        'descripcion',
        'codigo_convenio',
        'codigo_idea_cui',
        'descripcion_idea_cui',
        'beneficiarios',
        'codigo_interno',
        'id_sector',
        'id_direccion_linea',
        'creado_por',
        'actualizado_por'
    ];

    protected $dates = ['deleted_at', 'fecha_firma'];

    protected $casts = [
        'fecha_firma' => 'date',
        'monto' => 'decimal:2'
    ];

    // Relaciones
    public function municipalidad()
    {
        return $this->belongsTo(Municipalidad::class, 'id_municipalidad');
    }

    public function estadoConvenio()
    {
        return $this->belongsTo(EstadoConvenio::class, 'id_estado_convenio');
    }

    public function sector()
    {
        return $this->belongsTo(Sector::class, 'id_sector');
    }

    public function direccionLinea()
    {
        return $this->belongsTo(DireccionLinea::class, 'id_direccion_linea');
    }

    public function creadoPor()
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function actualizadoPor()
    {
        return $this->belongsTo(User::class, 'actualizado_por');
    }
}
