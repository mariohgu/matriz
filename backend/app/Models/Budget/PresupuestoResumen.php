<?php

namespace App\Models\Budget;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PresupuestoResumen extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'presupuesto_resumen';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id_pr';

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
        'mto_pia',
        'mto_modificaciones',
        'mto_pim',
        'mto_certificado',
        'mto_compro_anual',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'fecha' => 'datetime',
        'mto_pia' => 'float',
        'mto_modificaciones' => 'float',
        'mto_pim' => 'float',
        'mto_certificado' => 'float',
        'mto_compro_anual' => 'float',
    ];

    /**
     * Get the area ejecutora that owns the presupuesto.
     */
    public function areaEjecutora(): BelongsTo
    {
        return $this->belongsTo(AreaEjecutora::class, 'id_ae', 'id_ae');
    }

    /**
     * Get the clasificador that owns the presupuesto.
     */
    public function clasificador(): BelongsTo
    {
        return $this->belongsTo(Clasificador::class, 'id_clasificador', 'id_clasificador');
    }
} 