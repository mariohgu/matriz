<?php

namespace App\Models\Budget;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AreaEjecutora extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'areas_ejecutoras';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id_ae';

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
        'codigo',
        'descripcion',
    ];
    
    /**
     * Get the presupuestos for the area ejecutora.
     */
    public function presupuestos(): HasMany
    {
        return $this->hasMany(PresupuestoResumen::class, 'id_ae', 'id_ae');
    }
    
    /**
     * Get the ejecuciones mensuales for the area ejecutora.
     */
    public function ejecucionesMensuales(): HasMany
    {
        return $this->hasMany(EjecucionMensual::class, 'id_ae', 'id_ae');
    }
} 