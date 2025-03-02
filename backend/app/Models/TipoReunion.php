<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TipoReunion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tipos_reunion';
    protected $primaryKey = 'id_tipo_reunion';
    
    protected $fillable = [
        'descripcion'
    ];
}
