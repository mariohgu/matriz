<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rol;
use App\Models\Permiso;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolesPermisosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear roles básicos
        $rolAdmin = Rol::create([
            'nombre_rol' => 'admin',
            'descripcion' => 'Administrador con acceso completo al sistema',
        ]);

        $rolEditor = Rol::create([
            'nombre_rol' => 'editor',
            'descripcion' => 'Usuario con permisos para crear y editar contenido',
        ]);

        $rolUsuario = Rol::create([
            'nombre_rol' => 'usuario',
            'descripcion' => 'Usuario con permisos limitados de solo lectura',
        ]);

        // Crear permisos
        $permisos = [
            // Permisos de municipalidades
            ['nombre_permiso' => 'ver_municipalidad', 'descripcion' => 'Ver municipalidades'],
            ['nombre_permiso' => 'crear_municipalidad', 'descripcion' => 'Crear municipalidades'],
            ['nombre_permiso' => 'editar_municipalidad', 'descripcion' => 'Editar municipalidades'],
            ['nombre_permiso' => 'eliminar_municipalidad', 'descripcion' => 'Eliminar municipalidades'],
            
            // Permisos de contactos
            ['nombre_permiso' => 'ver_contacto', 'descripcion' => 'Ver contactos'],
            ['nombre_permiso' => 'crear_contacto', 'descripcion' => 'Crear contactos'],
            ['nombre_permiso' => 'editar_contacto', 'descripcion' => 'Editar contactos'],
            ['nombre_permiso' => 'eliminar_contacto', 'descripcion' => 'Eliminar contactos'],
            
            // Permisos de eventos
            ['nombre_permiso' => 'ver_evento', 'descripcion' => 'Ver eventos'],
            ['nombre_permiso' => 'crear_evento', 'descripcion' => 'Crear eventos'],
            ['nombre_permiso' => 'editar_evento', 'descripcion' => 'Editar eventos'],
            ['nombre_permiso' => 'eliminar_evento', 'descripcion' => 'Eliminar eventos'],
            
            // Permisos de oficios
            ['nombre_permiso' => 'ver_oficio', 'descripcion' => 'Ver oficios'],
            ['nombre_permiso' => 'crear_oficio', 'descripcion' => 'Crear oficios'],
            ['nombre_permiso' => 'editar_oficio', 'descripcion' => 'Editar oficios'],
            ['nombre_permiso' => 'eliminar_oficio', 'descripcion' => 'Eliminar oficios'],
            
            // Permisos de convenios
            ['nombre_permiso' => 'ver_convenio', 'descripcion' => 'Ver convenios'],
            ['nombre_permiso' => 'crear_convenio', 'descripcion' => 'Crear convenios'],
            ['nombre_permiso' => 'editar_convenio', 'descripcion' => 'Editar convenios'],
            ['nombre_permiso' => 'eliminar_convenio', 'descripcion' => 'Eliminar convenios'],
        ];

        $permisosCreados = [];
        foreach ($permisos as $permiso) {
            $permisosCreados[] = Permiso::create($permiso);
        }

        // Asignar todos los permisos al rol admin
        foreach ($permisosCreados as $permiso) {
            $rolAdmin->permisos()->attach($permiso->id_permiso);
        }

        // Asignar permisos al rol editor (todos excepto eliminar)
        foreach ($permisosCreados as $permiso) {
            if (!str_contains($permiso->nombre_permiso, 'eliminar')) {
                $rolEditor->permisos()->attach($permiso->id_permiso);
            }
        }

        // Asignar permisos al rol usuario (solo ver)
        foreach ($permisosCreados as $permiso) {
            if (str_contains($permiso->nombre_permiso, 'ver')) {
                $rolUsuario->permisos()->attach($permiso->id_permiso);
            }
        }

        // Crear usuario admin por defecto
        $adminUser = User::create([
            'name' => 'Administrador',
            'email' => 'admin@sistema.com',
            'password' => Hash::make('admin123'),
        ]);

        // Asignar rol admin al usuario
        $adminUser->roles()->attach($rolAdmin->id_rol);
    }
}
