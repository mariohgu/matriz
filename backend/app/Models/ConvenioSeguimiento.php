<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ConvenioSeguimiento extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'convenios_seguimiento';
    protected $primaryKey = 'id_convenio_seguimiento';
    public $timestamps = true;

    protected $fillable = [
        'id_convenio',
        'fecha',
        'id_estado_convenio',
        'comentarios',
        'acciones_realizadas',
        'alertas_identificadas',
        'acciones_desarrollar',
        'fecha_seguimiento'
    ];

    protected $dates = ['deleted_at', 'fecha', 'fecha_seguimiento'];

    // Relaciones
    public function convenio()
    {
        return $this->belongsTo(Convenio::class, 'id_convenio');
    }

    public function estadoConvenio()
    {
        return $this->belongsTo(EstadoConvenio::class, 'id_estado_convenio');
    }
} 