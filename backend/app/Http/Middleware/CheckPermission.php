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

        // Verificar si el token tiene alguno de los permisos requeridos
        $tokenPermissions = $request->user()->currentAccessToken()->abilities ?? [];
        
        $hasPermission = false;
        foreach ($permissions as $permission) {
            if (in_array($permission, $tokenPermissions)) {
                $hasPermission = true;
                break;
            }
        }

        if (!$hasPermission) {
            return response()->json([
                'message' => 'No tienes permisos suficientes para realizar esta acción'
            ], 403);
        }

        return $next($request);
    }
}
