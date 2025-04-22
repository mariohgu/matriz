<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        if (!$request->user()) {
            return response()->json([
                'message' => 'No autorizado'
            ], 401);
        }

        // Verificar tanto los permisos del token como los permisos de Spatie
        $tokenPermissions = $request->user()->currentAccessToken()->abilities ?? [];
        
        $hasTokenPermission = false;
        foreach ($permissions as $permission) {
            if (in_array($permission, $tokenPermissions)) {
                $hasTokenPermission = true;
                break;
            }
        }

        // Verificar si el usuario tiene alguno de los permisos requeridos usando Spatie
        $hasSpatiePerm = false;
        foreach ($permissions as $permission) {
            if ($request->user()->hasPermissionTo($permission)) {
                $hasSpatiePerm = true;
                break;
            }
        }

        if (!$hasTokenPermission && !$hasSpatiePerm) {
            return response()->json([
                'message' => 'No tienes permisos suficientes para realizar esta acción'
            ], 403);
        }

        return $next($request);
    }
}
