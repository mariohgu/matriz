<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sector extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'sector';
    protected $primaryKey = 'id_sector';
    public $timestamps = true;

    protected $fillable = [
        'descripcion'
    ];

    protected $dates = ['deleted_at'];
} 