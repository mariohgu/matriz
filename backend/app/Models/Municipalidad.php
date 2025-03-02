<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Municipalidad extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'municipalidades';
    protected $primaryKey = 'id_municipalidad';
    
    protected $fillable = [
        'ubigeo',
        'nombre',
        'departamento',
        'provincia',
        'distrito'
    ];
}
