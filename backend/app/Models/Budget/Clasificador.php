<?php

namespace App\Models\Budget;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Clasificador extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'clasificadores';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id_clasificador';

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
        'id_categoria',
        'codigo_clasificador',
        'descripcion',
    ];

    /**
     * Get the categoria that owns the clasificador.
     */
    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'id_categoria', 'id_categoria');
    }
    
    /**
     * Get the presupuestos for the clasificador.
     */
    public function presupuestos(): HasMany
    {
        return $this->hasMany(PresupuestoResumen::class, 'id_clasificador', 'id_clasificador');
    }
    
    /**
     * Get the ejecuciones mensuales for the clasificador.
     */
    public function ejecucionesMensuales(): HasMany
    {
        return $this->hasMany(EjecucionMensual::class, 'id_clasificador', 'id_clasificador');
    }
} 