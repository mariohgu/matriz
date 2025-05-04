<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EstadoConvenio extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'estados_convenios';
    protected $primaryKey = 'id_estado_convenio';
    public $timestamps = true;

    protected $fillable = [
        'descripcion',
        'nombre'
    ];

    protected $dates = ['deleted_at'];
} 