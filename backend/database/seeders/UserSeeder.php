<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Permission::create(['name' => 'ver-usuarios']);
        Permission::create(['name' => 'crear-usuarios']);
        Permission::create(['name' => 'editar-usuarios']);
        Permission::create(['name' => 'eliminar-usuarios']);
        Permission::create(['name' => 'ver-roles']);
        Permission::create(['name' => 'crear-roles']);
        Permission::create(['name' => 'editar-roles']);
        Permission::create(['name' => 'eliminar-roles']);
        Permission::create(['name' => 'ver-matriz']);
        Permission::create(['name' => 'cargar-matriz']);
        Permission::create(['name' => 'eliminar-matriz']);
        Permission::create(['name' => 'ver-presupuesto']);

        
        $user_mario = User::create([
            'name' => 'Mario',
            'username' => 'mario',
            'email' => 'mario@gmail.com',
            'password' => Hash::make('desconocida4*'),
        ]);


        $admin = Role::create(['name' => 'super-admin']);
        $user_mario->assignRole('super-admin');
        $permission_admin = Permission::query()->pluck('name');
        $admin->syncPermissions($permission_admin);

        $usuario = Role::create(['name' => 'usuario']);
        $usuario->syncPermissions(['ver-usuarios']);

        $editor = Role::create(['name' => 'editor']);
        $editor->syncPermissions(['ver-usuarios', 'crear-usuarios', 'editar-usuarios']);

        $admin = Role::create(['name' => 'admin']);
        $admin->syncPermissions(['ver-usuarios', 'crear-usuarios', 'editar-usuarios', 'eliminar-usuarios', 'cargar-matriz', 'eliminar-matriz', 'ver-presupuesto', 'ver-matriz']);

        $visitas = Role::create(['name' => 'visitas']);
        $visitas->syncPermissions(['ver-presupuesto']);

        $presupuesto = Role::create(['name' => 'analista']);
        $presupuesto->syncPermissions(['ver-presupuesto', 'ver-matriz']);

        $matriz_admin = Role::create(['name' => 'matriz-admin']);
        $matriz_admin->syncPermissions(['ver-matriz', 'cargar-matriz', 'eliminar-matriz']);

        $matriz_editor = Role::create(['name' => 'matriz-editor']);
        $matriz_editor->syncPermissions(['ver-matriz', 'cargar-matriz']);

        $matriz_usuario = Role::create(['name' => 'matriz-usuario']);
        $matriz_usuario->syncPermissions(['ver-matriz']);
        
        
        
        
        
        
    }
}
