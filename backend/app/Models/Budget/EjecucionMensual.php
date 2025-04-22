<?php

namespace App\Models\Budget;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EjecucionMensual extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ejecucion_mensual';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id_em';

    /**
     * The database connection that should be used by the model.
     *
     * @var string
     */
    protected $connection = 'mysql_budget';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_ae',
        'id_clasificador',
        'fecha',
        'anio',
        'mes',
        'mto_at_comp',
        'mto_devengado',
        'mto_girado',
        'mto_pagado',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'fecha' => 'datetime',
        'anio' => 'integer',
        'mes' => 'integer',
        'mto_at_comp' => 'float',
        'mto_devengado' => 'float',
        'mto_girado' => 'float',
        'mto_pagado' => 'float',
    ];

    /**
     * Get the area ejecutora that owns the ejecución mensual.
     */
    public function areaEjecutora(): BelongsTo
    {
        return $this->belongsTo(AreaEjecutora::class, 'id_ae', 'id_ae');
    }

    /**
     * Get the clasificador that owns the ejecución mensual.
     */
    public function clasificador(): BelongsTo
    {
        return $this->belongsTo(Clasificador::class, 'id_clasificador', 'id_clasificador');
    }
} 