<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DireccionLinea extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'direccion_linea';
    protected $primaryKey = 'id_direccion_linea';
    public $timestamps = true;

    protected $fillable = [
        'descripcion'
    ];

    protected $dates = ['deleted_at'];
} 