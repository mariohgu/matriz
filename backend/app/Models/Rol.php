<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    use HasFactory;

    protected $table = 'roles';
    protected $primaryKey = 'id_rol';

    protected $fillable = [
        'nombre_rol',
        'descripcion'
    ];

    /**
     * Relación con permisos
     */
    public function permisos()
    {
        return $this->belongsToMany(Permiso::class, 'roles_permisos', 'id_rol', 'id_permiso');
    }

    /**
     * Relación con usuarios
     */
    public function usuarios()
    {
        return $this->belongsToMany(User::class, 'usuarios_roles', 'id_rol', 'id_usuario');
    }
}
