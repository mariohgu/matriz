<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class UpdateUserPasswords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:rehash-passwords {user? : ID de usuario específico (opcional)} {--all : Actualizar todos los usuarios}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Actualizar contraseñas de usuarios al formato Bcrypt requerido por Laravel';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->argument('user');
        $updateAll = $this->option('all');

        if (!$userId && !$updateAll) {
            $action = $this->choice(
                '¿Qué acción deseas realizar?',
                [
                    'Actualizar un usuario específico', 
                    'Actualizar todos los usuarios', 
                    'Cancelar'
                ],
                0
            );

            if ($action === 'Cancelar') {
                $this->info('Operación cancelada.');
                return 0;
            }

            $updateAll = $action === 'Actualizar todos los usuarios';
            
            if (!$updateAll) {
                $userId = $this->ask('Ingresa el ID del usuario que deseas actualizar');
            }
        }

        if ($userId) {
            // Actualizar usuario específico
            $user = User::find($userId);
            
            if (!$user) {
                $this->error("No se encontró un usuario con ID {$userId}");
                return 1;
            }

            $this->updateUserPassword($user);
            $this->info("Contraseña actualizada para el usuario {$user->name} (ID: {$user->id})");
        } elseif ($updateAll) {
            // Actualizar todos los usuarios
            $users = User::all();
            $this->info("Actualizando contraseñas para {$users->count()} usuarios...");
            
            $bar = $this->output->createProgressBar($users->count());
            $bar->start();
            
            foreach ($users as $user) {
                $this->updateUserPassword($user);
                $bar->advance();
            }
            
            $bar->finish();
            $this->newLine();
            $this->info('Todas las contraseñas han sido actualizadas correctamente.');
        }

        return 0;
    }

    /**
     * Actualiza la contraseña de un usuario
     */
    private function updateUserPassword(User $user)
    {
        $option = $this->choice(
            "Usuario: {$user->name} (ID: {$user->id}). ¿Qué deseas hacer?",
            [
                'Establecer nueva contraseña', 
                'Rehashear contraseña actual (si conoces la original)', 
                'Omitir este usuario'
            ],
            0
        );

        if ($option === 'Omitir este usuario') {
            return;
        }

        if ($option === 'Establecer nueva contraseña') {
            $newPassword = $this->secret('Ingresa la nueva contraseña para el usuario');
            
            if (empty($newPassword)) {
                $this->error('La contraseña no puede estar vacía');
                return;
            }
            
            $user->password = Hash::make($newPassword);
            $user->save();
            
            $this->info("Contraseña actualizada para {$user->name}");
        } else {
            $originalPassword = $this->secret('Ingresa la contraseña original del usuario');
            
            if (empty($originalPassword)) {
                $this->error('La contraseña no puede estar vacía');
                return;
            }
            
            $user->password = Hash::make($originalPassword);
            $user->save();
            
            $this->info("Contraseña rehashada para {$user->name}");
        }
    }
}
