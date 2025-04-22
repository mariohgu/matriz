<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SpatieRolesPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reiniciar caché de roles y permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Crear permisos
        $permisos = [
            // Permisos de municipalidades
            'ver_municipalidad',
            'crear_municipalidad',
            'editar_municipalidad',
            'eliminar_municipalidad',
            
            // Permisos de contactos
            'ver_contacto',
            'crear_contacto',
            'editar_contacto',
            'eliminar_contacto',
            
            // Permisos de eventos
            'ver_evento',
            'crear_evento',
            'editar_evento',
            'eliminar_evento',
            
            // Permisos de oficios
            'ver_oficio',
            'crear_oficio',
            'editar_oficio',
            'eliminar_oficio',
            
            // Permisos de convenios
            'ver_convenio',
            'crear_convenio',
            'editar_convenio',
            'eliminar_convenio',
        ];

        // Crear permisos si no existen
        foreach ($permisos as $permiso) {
            Permission::findOrCreate($permiso, 'web');
        }

        // Crear roles si no existen
        $rolAdmin = Role::findOrCreate('admin', 'web');
        $rolEditor = Role::findOrCreate('editor', 'web');
        $rolUsuario = Role::findOrCreate('usuario', 'web');

        // Asignar todos los permisos al rol admin
        $rolAdmin->syncPermissions($permisos);

        // Asignar permisos al rol editor (todos excepto eliminar)
        $permisosEditor = array_filter($permisos, function($permiso) {
            return !str_contains($permiso, 'eliminar');
        });
        $rolEditor->syncPermissions($permisosEditor);

        // Asignar permisos al rol usuario (solo ver)
        $permisosUsuario = array_filter($permisos, function($permiso) {
            return str_contains($permiso, 'ver');
        });
        $rolUsuario->syncPermissions($permisosUsuario);

        // Asignar roles a usuarios existentes
        $users = User::all();
        foreach ($users as $user) {
            // Como no podemos acceder a la tabla antigua, asignamos roles predeterminados
            // basados en alguna lógica o regla específica
            
            // Por ejemplo, podríamos asignar el rol 'admin' al primer usuario
            if ($user->id === 1) {
                $user->syncRoles(['admin']);
            } else {
                // Y a todos los demás el rol de usuario
                $user->syncRoles(['usuario']);
            }
            
            // Nota: Si necesitas una lógica más específica para asignar roles,
            // puedes implementarla aquí basada en otros atributos del usuario
        }
    }
} 