<?php

namespace App\Models\Budget;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'categorias';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id_categoria';

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
        'descripcion',
    ];
    
    /**
     * Get the clasificadores for the categoria.
     */
    public function clasificadores(): HasMany
    {
        return $this->hasMany(Clasificador::class, 'id_categoria', 'id_categoria');
    }
} 