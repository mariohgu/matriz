<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\User;
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

        //Me gustaria que mi usuario  mario que ya existe en la base de datos tenga los permisos de admin
        $user_mario = User::create([
            'name' => 'Mario',
            'username' => 'mario',
            'email' => 'mario@gmail.com',
            'password' => Hash::make('desconocida4*'),
        ]);


        $admin = Role::create(['name' => 'super-admin']);
        $user_mario->assignRole('super-admin');
        // $user_mario->givePermissionTo('ver-usuarios');
        // $user_mario->givePermissionTo('crear-usuarios');
        // $user_mario->givePermissionTo('editar-usuarios');
        // $user_mario->givePermissionTo('eliminar-usuarios');
        $permission_admin = Permission::query()->pluck('name');
        $admin->syncPermissions($permission_admin);
        
        
    }
}
