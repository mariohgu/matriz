<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relación con roles
     */
    public function roles()
    {
        return $this->belongsToMany(Rol::class, 'usuarios_roles', 'id_usuario', 'id_rol');
    }

    /**
     * Verifica si el usuario tiene un rol específico
     */
    public function hasRole($roleName)
    {
        return $this->roles()->where('nombre_rol', $roleName)->exists();
    }

    /**
     * Verifica si el usuario tiene un permiso específico a través de sus roles
     */
    public function hasPermission($permissionName)
    {
        foreach ($this->roles as $role) {
            foreach ($role->permisos as $permission) {
                if ($permission->nombre_permiso === $permissionName) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Verifica si el usuario tiene alguno de los permisos proporcionados
     */
    public function hasAnyPermission(array $permissions)
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Verifica si el usuario tiene todos los permisos proporcionados
     */
    public function hasAllPermissions(array $permissions)
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        
        return true;
    }
}
