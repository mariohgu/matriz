<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Registrar un nuevo usuario
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Asignar rol por defecto (usuario común)
        $defaultRole = Rol::where('nombre_rol', 'usuario')->first();
        if ($defaultRole) {
            $user->roles()->attach($defaultRole->id_rol);
        }

        return response()->json([
            'message' => 'Usuario registrado exitosamente',
            'user' => $user
        ], 201);
    }

    /**
     * Iniciar sesión y generar token
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Intentar autenticar utilizando el nombre de usuario
        if (!Auth::attempt(['username' => $request->username, 'password' => $request->password])) {
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        $user = User::where('username', $request->username)->firstOrFail();
        
        // Cargar los roles y permisos del usuario
        $user->load('roles.permisos');
        
        // Crear token con permisos basados en los roles del usuario
        $token = $user->createToken('auth_token', $this->getUserPermissions($user))->plainTextToken;

        return response()->json([
            'message' => 'Inicio de sesión exitoso',
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Cerrar sesión (revocar tokens)
     */
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente'
        ]);
    }

    /**
     * Obtener información del usuario autenticado
     */
    public function user(Request $request)
    {
        $user = $request->user()->load('roles.permisos');
        
        return response()->json([
            'user' => $user,
            'roles' => $user->roles,
            'permissions' => $this->getUserPermissions($user)
        ]);
    }
    
    /**
     * Actualizar token con nuevos permisos (si los roles del usuario cambiaron)
     */
    public function refreshToken(Request $request)
    {
        $user = $request->user();
        $user->load('roles.permisos');
        
        // Revocar tokens actuales
        $user->tokens()->delete();
        
        // Crear nuevo token con permisos actualizados
        $token = $user->createToken('auth_token', $this->getUserPermissions($user))->plainTextToken;
        
        return response()->json([
            'message' => 'Token actualizado',
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }
    
    /**
     * Extraer todos los permisos únicos de un usuario basado en sus roles
     */
    private function getUserPermissions(User $user)
    {
        $permissions = [];
        
        foreach ($user->roles as $role) {
            foreach ($role->permisos as $permission) {
                $permissions[] = $permission->nombre_permiso;
            }
        }
        
        return array_unique($permissions);
    }
}
