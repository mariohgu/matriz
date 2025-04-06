<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsRestriction
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Obtener los orígenes permitidos desde .env o usar un valor predeterminado
        $allowedOrigins = env('ALLOWED_ORIGINS');
        $allowedOriginsArray = explode(',', $allowedOrigins);
        
        $origin = $request->header('Origin');
        
        // Si el origen de la solicitud está en la lista de permitidos
        if ($origin && in_array($origin, $allowedOriginsArray)) {
            return $next($request)
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization')
                ->header('Access-Control-Allow-Credentials', 'true');
        }
        
        // Si es una solicitud preflight OPTIONS, permitirla pero solo para orígenes permitidos
        if ($request->isMethod('OPTIONS')) {
            return response('', 200)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization');
        }
        
        // Si no es un origen permitido y no es preflight
        if ($origin && !in_array($origin, $allowedOriginsArray)) {
            return response()->json(['error' => 'Unauthorized origin'], 403);
        }
        
        return $next($request);
    }
}
